import { StorageManager } from './storage.js';
class OperatorPanel {
    constructor() {
        this.soundOn = false;
        this.audioCtx = null;
        console.log('operator.js versi baru aktif');
        if (!this.checkAuth())
            return;
        document.addEventListener('click', (e) => this.handleClick(e));
        this.renderPanel();
        window.addEventListener('storage', () => this.renderPanel());
        window.addEventListener('storageUpdated', () => this.renderPanel());
        setInterval(() => this.renderPanel(), 3000);
    }
    checkAuth() {
        const auth = StorageManager.getAuth();
        if (!auth || auth.role !== 'user') {
            window.location.href = 'login.html';
            return false;
        }
        const nameEl = document.getElementById('operatorName');
        if (nameEl)
            nameEl.textContent = `Halo, ${auth.firstName}`;
        return true;
    }
    handleClick(e) {
        const target = e.target;
        if (!target)
            return;
        const btn = target.closest('button');
        if (!btn)
            return;
        if (btn.id === 'btnSound')
            this.toggleSound(btn);
        if (btn.id === 'btnLogout')
            this.handleLogout();
    }
    handleLogout() {
        window.speechSynthesis.cancel();
        StorageManager.clearAuth();
        window.location.href = 'login.html';
    }
    toggleSound(btn) {
        var _a;
        this.soundOn = !this.soundOn;
        btn.textContent = this.soundOn ? 'Suara: Aktif' : 'Suara: Mati';
        btn.classList.toggle('active', this.soundOn);
        if (!this.soundOn) {
            window.speechSynthesis.cancel();
            return;
        }
        if (!this.audioCtx) {
            const AudioCtx = (_a = window.AudioContext) !== null && _a !== void 0 ? _a : window.webkitAudioContext;
            this.audioCtx = new AudioCtx();
        }
        if (this.audioCtx.state === 'suspended')
            this.audioCtx.resume();
        window.speechSynthesis.getVoices();
        this.playChime();
    }
    getPriorityWeight(priority) {
        switch (priority) {
            case 'VIP': return 4;
            case 'Disabilitas': return 3;
            case 'Lansia': return 2;
            case 'Normal': return 1;
            default: return 0;
        }
    }
    getWaitingTickets(queueTickets) {
        return queueTickets
            .filter(t => t.status === 'Menunggu')
            .sort((a, b) => {
            const weightDiff = this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
            if (weightDiff !== 0)
                return weightDiff;
            return a.createdAt - b.createdAt;
        });
    }
    // Tiket yang dilewati baru masuk giliran lagi setelah ada pasien lain
    // yang dipanggil sesudah dia dilewati.
    getDueSkipped(queueTickets) {
        const lastCallTime = queueTickets.reduce((max, t) => { var _a; return Math.max(max, (_a = t.calledAt) !== null && _a !== void 0 ? _a : 0); }, 0);
        return queueTickets
            .filter(t => { var _a; return t.status === 'Dilewati' && ((_a = t.skippedAt) !== null && _a !== void 0 ? _a : 0) < lastCallTime; })
            .sort((a, b) => { var _a, _b; return ((_a = a.skippedAt) !== null && _a !== void 0 ? _a : 0) - ((_b = b.skippedAt) !== null && _b !== void 0 ? _b : 0); });
    }
    getNextTicket(queueTickets) {
        const dueSkipped = this.getDueSkipped(queueTickets);
        if (dueSkipped.length > 0)
            return dueSkipped[0];
        const waiting = this.getWaitingTickets(queueTickets);
        return waiting.length > 0 ? waiting[0] : null;
    }
    renderPanel() {
        const grid = document.getElementById('operatorGrid');
        if (!grid)
            return;
        const queues = StorageManager.getQueueTypes().filter(q => q.isActive);
        const tickets = StorageManager.getTickets();
        grid.innerHTML = '';
        if (queues.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'text-muted';
            empty.textContent = 'Belum ada jenis antrian yang aktif. Hubungi Admin.';
            grid.appendChild(empty);
            return;
        }
        queues.forEach(queue => {
            const queueTickets = tickets.filter(t => t.queueCode === queue.code);
            grid.appendChild(this.createOperatorCard(queue, queueTickets));
        });
    }
    createOperatorCard(queue, queueTickets) {
        const currentTicket = queueTickets.find(t => t.status === 'Dipanggil');
        const waitingTickets = this.getWaitingTickets(queueTickets);
        const skippedTickets = queueTickets
            .filter(t => t.status === 'Dilewati')
            .sort((a, b) => { var _a, _b; return ((_a = a.skippedAt) !== null && _a !== void 0 ? _a : 0) - ((_b = b.skippedAt) !== null && _b !== void 0 ? _b : 0); });
        const nextTicket = this.getNextTicket(queueTickets);
        const nextIsReturning = nextTicket !== null && nextTicket.status === 'Dilewati';
        const card = document.createElement('div');
        card.className = 'card';
        const currentHtml = currentTicket
            ? `<p class="operator-number">${currentTicket.displayNumber}</p>`
            : `<p class="operator-number operator-number--muted">-</p>`;
        const nextHtml = nextTicket
            ? `<h4 class="operator-next-number">${nextTicket.displayNumber}</h4>
               <small class="text-muted">${nextIsReturning ? 'Kembali dari terlewat' : 'Prioritas ' + nextTicket.priority}</small>`
            : `<h4 class="operator-next-number">-</h4>`;
        card.innerHTML = `
            <div class="d-flex justify-content-between mb-3 align-items-center">
                <h3>${queue.name}</h3>
                <small class="text-muted">${waitingTickets.length} menunggu</small>
            </div>
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <small class="status-badge status-dipanggil mb-1">SEDANG DIPANGGIL</small>
                    ${currentHtml}
                </div>
                <div>
                    <small class="${nextIsReturning ? 'status-badge status-dilewati' : 'text-muted'} mb-1">BERIKUTNYA</small>
                    ${nextHtml}
                </div>
            </div>
            <div class="operator-actions">
                <button class="btn btn-primary btn-panggil" type="button">Panggil Berikutnya</button>
                <button class="btn btn-secondary btn-lewati" type="button" ${!currentTicket ? 'disabled' : ''}>Lewati</button>
                <button class="btn btn-success btn-selesai" type="button" ${!currentTicket ? 'disabled' : ''}>Selesai</button>
            </div>
        `;
        const btnPanggil = card.querySelector('.btn-panggil');
        const btnLewati = card.querySelector('.btn-lewati');
        const btnSelesai = card.querySelector('.btn-selesai');
        if (!nextTicket && !currentTicket)
            btnPanggil.disabled = true;
        btnPanggil.addEventListener('click', () => this.handleCallNext(queue, currentTicket === null || currentTicket === void 0 ? void 0 : currentTicket.id, nextTicket === null || nextTicket === void 0 ? void 0 : nextTicket.id));
        btnLewati.addEventListener('click', () => this.handleSkip(currentTicket === null || currentTicket === void 0 ? void 0 : currentTicket.id));
        btnSelesai.addEventListener('click', () => this.handleAction(currentTicket === null || currentTicket === void 0 ? void 0 : currentTicket.id, 'Selesai'));
        if (waitingTickets.length > 0) {
            card.appendChild(this.buildWaitingList(waitingTickets));
        }
        if (skippedTickets.length > 0) {
            card.appendChild(this.buildSkippedList(skippedTickets, queue));
        }
        if (waitingTickets.length === 0 && skippedTickets.length === 0 && !currentTicket) {
            const info = document.createElement('p');
            info.className = 'text-muted mt-3';
            info.style.fontSize = '0.85rem';
            info.textContent = 'Tidak ada antrian menunggu.';
            card.appendChild(info);
        }
        return card;
    }
    buildWaitingList(tickets) {
        const wrapper = document.createElement('div');
        const heading = document.createElement('p');
        heading.className = 'operator-section-title';
        heading.textContent = `Menunggu (${tickets.length})`;
        wrapper.appendChild(heading);
        const list = document.createElement('div');
        list.className = 'operator-list';
        tickets.forEach(ticket => {
            const item = document.createElement('div');
            item.className = 'operator-list-item';
            const badge = document.createElement('span');
            badge.className = 'status-badge status-menunggu';
            badge.textContent = ticket.displayNumber;
            const info = document.createElement('span');
            info.className = 'text-muted';
            info.textContent = ticket.priority;
            item.append(badge, info);
            list.appendChild(item);
        });
        wrapper.appendChild(list);
        return wrapper;
    }
    buildSkippedList(tickets, queue) {
        const wrapper = document.createElement('div');
        const head = document.createElement('div');
        head.className = 'operator-section-head';
        const heading = document.createElement('p');
        heading.className = 'operator-section-title';
        heading.textContent = `Terlewat (${tickets.length})`;
        const btnClearAll = document.createElement('button');
        btnClearAll.type = 'button';
        btnClearAll.className = 'btn btn-danger';
        btnClearAll.textContent = 'Hapus Semua';
        btnClearAll.addEventListener('click', () => this.handleDeleteAllSkipped(tickets, queue));
        head.append(heading, btnClearAll);
        wrapper.appendChild(head);
        const list = document.createElement('div');
        list.className = 'operator-list';
        tickets.forEach(ticket => {
            const item = document.createElement('div');
            item.className = 'operator-list-item';
            const badge = document.createElement('span');
            badge.className = 'status-badge status-dilewati';
            badge.textContent = ticket.displayNumber;
            const actions = document.createElement('div');
            actions.className = 'operator-list-actions';
            const btnRecall = document.createElement('button');
            btnRecall.type = 'button';
            btnRecall.className = 'btn btn-outline';
            btnRecall.textContent = 'Panggil';
            btnRecall.addEventListener('click', () => this.handleRecall(ticket, queue));
            const btnDelete = document.createElement('button');
            btnDelete.type = 'button';
            btnDelete.className = 'btn btn-danger';
            btnDelete.textContent = 'Hapus';
            btnDelete.addEventListener('click', () => this.handleDeleteSkipped(ticket));
            actions.append(btnRecall, btnDelete);
            item.append(badge, actions);
            list.appendChild(item);
        });
        wrapper.appendChild(list);
        return wrapper;
    }
    handleCallNext(queue, currentTicketId, nextTicketId) {
        const tickets = StorageManager.getTickets();
        if (currentTicketId) {
            const currentIdx = tickets.findIndex(t => t.id === currentTicketId);
            if (currentIdx !== -1)
                tickets[currentIdx].status = 'Selesai';
        }
        if (nextTicketId) {
            const nextIdx = tickets.findIndex(t => t.id === nextTicketId);
            if (nextIdx !== -1) {
                tickets[nextIdx].status = 'Dipanggil';
                tickets[nextIdx].calledAt = Date.now();
                this.announce(tickets[nextIdx], queue);
            }
        }
        StorageManager.setTickets(tickets);
        StorageManager.triggerUpdate();
        this.renderPanel();
    }
    handleSkip(ticketId) {
        if (!ticketId)
            return;
        const tickets = StorageManager.getTickets();
        const idx = tickets.findIndex(t => t.id === ticketId);
        if (idx !== -1) {
            tickets[idx].status = 'Dilewati';
            tickets[idx].skippedAt = Date.now();
            StorageManager.setTickets(tickets);
            StorageManager.triggerUpdate();
            this.renderPanel();
        }
    }
    handleAction(ticketId, targetStatus) {
        if (!ticketId)
            return;
        const tickets = StorageManager.getTickets();
        const idx = tickets.findIndex(t => t.id === ticketId);
        if (idx !== -1) {
            tickets[idx].status = targetStatus;
            StorageManager.setTickets(tickets);
            StorageManager.triggerUpdate();
            this.renderPanel();
        }
    }
    handleRecall(ticket, queue) {
        const tickets = StorageManager.getTickets();
        const currentIdx = tickets.findIndex(t => t.queueCode === queue.code && t.status === 'Dipanggil');
        if (currentIdx !== -1)
            tickets[currentIdx].status = 'Selesai';
        const targetIdx = tickets.findIndex(t => t.id === ticket.id);
        if (targetIdx !== -1) {
            tickets[targetIdx].status = 'Dipanggil';
            tickets[targetIdx].calledAt = Date.now();
            this.announce(tickets[targetIdx], queue);
        }
        StorageManager.setTickets(tickets);
        StorageManager.triggerUpdate();
        this.renderPanel();
    }
    // Hapus satu tiket terlewat dari data secara permanen.
    handleDeleteSkipped(ticket) {
        const setuju = confirm(`Hapus antrian ${ticket.displayNumber} dari daftar terlewat? Tindakan ini tidak bisa dibatalkan.`);
        if (!setuju)
            return;
        const tickets = StorageManager.getTickets().filter(t => t.id !== ticket.id);
        StorageManager.setTickets(tickets);
        StorageManager.triggerUpdate();
        this.renderPanel();
    }
    // Hapus semua tiket terlewat di satu layanan.
    handleDeleteAllSkipped(skipped, queue) {
        const setuju = confirm(`Hapus semua ${skipped.length} antrian terlewat di ${queue.name}? Tindakan ini tidak bisa dibatalkan.`);
        if (!setuju)
            return;
        const hapusIds = skipped.map(t => t.id);
        const tickets = StorageManager.getTickets().filter(t => hapusIds.indexOf(t.id) === -1);
        StorageManager.setTickets(tickets);
        StorageManager.triggerUpdate();
        this.renderPanel();
    }
    playChime() {
        if (!this.audioCtx)
            return;
        const ctx = this.audioCtx;
        if (ctx.state === 'suspended')
            ctx.resume();
        const notes = [
            { freq: 659.25, start: 0, length: 0.55 },
            { freq: 523.25, start: 0.33, length: 0.85 },
        ];
        notes.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const at = ctx.currentTime + note.start;
            osc.type = 'sine';
            osc.frequency.value = note.freq;
            gain.gain.setValueAtTime(0.0001, at);
            gain.gain.exponentialRampToValueAtTime(0.3, at + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, at + note.length);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(at);
            osc.stop(at + note.length + 0.05);
        });
    }
    pickVoice() {
        var _a;
        const voices = window.speechSynthesis.getVoices();
        const id = (_a = voices.find(v => v.lang === 'id-ID')) !== null && _a !== void 0 ? _a : voices.find(v => v.lang.indexOf('id') === 0);
        return id !== null && id !== void 0 ? id : null;
    }
    announce(ticket, queue) {
        if (!this.soundOn)
            return;
        this.playChime();
        if (!('speechSynthesis' in window))
            return;
        setTimeout(() => {
            const text = `Nomor antrian ${queue.code}, ${ticket.ticketNumber}. Silakan menuju ${queue.name}.`;
            const speech = new SpeechSynthesisUtterance(text);
            speech.lang = 'id-ID';
            speech.rate = 0.9;
            const voice = this.pickVoice();
            if (voice)
                speech.voice = voice;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(speech);
        }, 1300);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new OperatorPanel();
});
