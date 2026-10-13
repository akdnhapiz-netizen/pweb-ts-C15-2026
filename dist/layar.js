import { StorageManager } from './storage.js';
class QueueDisplay {
    constructor() {
        this.lastCalled = {};
        this.heroTicketId = '';
        this.firstRender = true;
        console.log('layar.js versi baru aktif');
        document.addEventListener('click', (e) => this.handleClick(e));
        document.addEventListener('fullscreenchange', () => this.syncFullscreenLabel());
        this.render();
        window.addEventListener('storage', () => this.render());
        window.addEventListener('storageUpdated', () => this.render());
        setInterval(() => this.render(), 2000);
    }
    handleClick(e) {
        const target = e.target;
        if (!target)
            return;
        const btn = target.closest('button');
        if (!btn)
            return;
        if (btn.id === 'btnFullscreen')
            this.toggleFullscreen();
        if (btn.id === 'btnExit')
            this.handleExit();
    }
    handleExit() {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => undefined);
        }
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 100);
    }
    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => undefined);
        }
        else {
            document.documentElement.requestFullscreen().catch(() => {
                alert('Browser tidak mengizinkan mode layar penuh.');
            });
        }
    }
    syncFullscreenLabel() {
        const btn = document.getElementById('btnFullscreen');
        if (!btn)
            return;
        btn.textContent = document.fullscreenElement ? 'Keluar Layar Penuh' : 'Layar Penuh';
    }
    render() {
        const grid = document.getElementById('layarGrid');
        if (!grid)
            return;
        const queues = StorageManager.getQueueTypes().filter(q => q.isActive);
        const tickets = StorageManager.getTickets();
        grid.innerHTML = '';
        if (queues.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'text-muted';
            empty.textContent = 'Belum ada layanan aktif.';
            grid.appendChild(empty);
        }
        queues.forEach(queue => {
            const current = tickets.find(t => t.queueCode === queue.code && t.status === 'Dipanggil');
            const waitingCount = tickets.filter(t => t.queueCode === queue.code && t.status === 'Menunggu').length;
            const nowNumber = current ? current.displayNumber : '';
            const isNewCall = current !== undefined && nowNumber !== this.lastCalled[queue.code] && !this.firstRender;
            this.lastCalled[queue.code] = nowNumber;
            if (isNewCall && current) {
                this.heroTicketId = current.id;
                this.flashHero();
            }
            grid.appendChild(this.createCard(queue, current, waitingCount, isNewCall));
        });
        this.renderHero(tickets, queues);
        this.updateTime();
        this.firstRender = false;
    }
    renderHero(tickets, queues) {
        const heroNumber = document.getElementById('heroNumber');
        const heroService = document.getElementById('heroService');
        if (!heroNumber || !heroService)
            return;
        const activeCodes = queues.map(q => q.code);
        const called = tickets.filter(t => t.status === 'Dipanggil' && activeCodes.indexOf(t.queueCode) !== -1);
        let heroTicket = called.find(t => t.id === this.heroTicketId);
        if (!heroTicket)
            heroTicket = called[0];
        if (heroTicket) {
            this.heroTicketId = heroTicket.id;
            heroNumber.textContent = heroTicket.displayNumber;
            heroService.textContent = heroTicket.serviceName;
        }
        else {
            this.heroTicketId = '';
            heroNumber.textContent = '---';
            heroService.textContent = 'Menunggu panggilan';
        }
    }
    createCard(queue, current, waitingCount, isNewCall) {
        const card = document.createElement('article');
        card.className = 'layar-card';
        if (current)
            card.classList.add('is-active');
        if (isNewCall)
            card.classList.add('highlight');
        const head = document.createElement('div');
        head.className = 'layar-card-head';
        const code = document.createElement('span');
        code.className = 'layar-code';
        code.textContent = queue.code;
        const name = document.createElement('h3');
        name.textContent = queue.name;
        head.append(code, name);
        const number = document.createElement('p');
        if (current) {
            number.className = 'layar-number';
            number.textContent = current.displayNumber;
        }
        else {
            number.className = 'layar-number layar-number--empty';
            number.textContent = 'Belum ada antrian';
        }
        const foot = document.createElement('div');
        foot.className = 'layar-foot';
        const status = document.createElement('span');
        status.className = current ? 'status-badge status-dipanggil' : 'status-badge status-menunggu';
        status.textContent = current ? 'Dipanggil' : 'Kosong';
        const waiting = document.createElement('span');
        waiting.textContent = `Sisa antrian: ${waitingCount} orang`;
        foot.append(status, waiting);
        card.append(head, number, foot);
        return card;
    }
    flashHero() {
        const hero = document.getElementById('layarHero');
        if (!hero)
            return;
        hero.classList.remove('flash');
        void hero.offsetWidth;
        hero.classList.add('flash');
    }
    updateTime() {
        const el = document.getElementById('lastUpdated');
        if (!el)
            return;
        const now = new Date();
        el.textContent = `Diperbarui: ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new QueueDisplay();
});
