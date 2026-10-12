import { StorageManager } from './storage.js';
class OperatorPanel {
    constructor() {
        this.gridContainer = document.getElementById('operatorGrid');
        this.btnLogout = document.getElementById('btnLogout');
        this.operatorName = document.getElementById('operatorName');
        this.checkAuth();
        this.initEvents();
        this.renderPanel();
        window.addEventListener('storage', () => this.renderPanel());
        window.addEventListener('storageUpdated', () => this.renderPanel());
        setInterval(() => this.renderPanel(), 3000);
    }
    checkAuth() {
        const auth = StorageManager.getAuth();
        if (!auth) {
            window.location.href = 'login.html';
            return;
        }
        this.operatorName.textContent = `Halo, ${auth.firstName}`;
    }
    initEvents() {
        this.btnLogout.addEventListener('click', () => {
            StorageManager.clearAuth();
            window.location.href = 'login.html';
        });
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
    renderPanel() {
        const queues = StorageManager.getQueueTypes().filter(q => q.isActive);
        const tickets = StorageManager.getTickets();
        this.gridContainer.innerHTML = '';
        if (queues.length === 0) {
            this.gridContainer.innerHTML = `<div class="text-center text-muted w-100">Belum ada jenis antrian yang aktif. Hubungi Admin.</div>`;
            return;
        }
        queues.forEach(queue => {
            const queueTickets = tickets.filter(t => t.queueCode === queue.code);
            const currentTicket = queueTickets.find(t => t.status === 'Dipanggil');
            const waitingTickets = queueTickets
                .filter(t => t.status === 'Menunggu')
                .sort((a, b) => {
                const weightDiff = this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
                if (weightDiff !== 0)
                    return weightDiff;
                return a.createdAt - b.createdAt;
            });
            const nextTicket = waitingTickets.length > 0 ? waitingTickets[0] : null;
            const waitingCount = waitingTickets.length;
            this.createOperatorCard(queue, currentTicket, nextTicket, waitingCount);
        });
    }
    createOperatorCard(queue, currentTicket, nextTicket, waitingCount) {
        const card = document.createElement('div');
        card.className = 'card';
        let currentHtml = currentTicket
            ? `<h2 class="ticket-number-huge" style="color: var(--primary);">${currentTicket.displayNumber}</h2>`
            : `<h2 style="color: var(--text-muted);">-</h2>`;
        let nextHtml = nextTicket
            ? `<h4>${nextTicket.displayNumber}</h4><small class="text-muted">Prioritas ${nextTicket.priority}</small>`
            : `<h4>-</h4>`;
        card.innerHTML = `
            <div class="d-flex justify-content-between mb-3 align-items-center">
                <h3>${queue.name}</h3>
                <small class="text-muted">${waitingCount} menunggu</small>
            </div>
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <small class="status-badge status-dipanggil mb-1">SEDANG DIPANGGIL</small>
                    ${currentHtml}
                </div>
                <div>
                    <small class="text-muted mb-1">BERIKUTNYA</small>
                    ${nextHtml}
                </div>
            </div>
            <div class="d-flex" style="gap: 10px;">
                <button class="btn btn-primary btn-panggil w-100" style="flex: 2;">Panggil Berikutnya</button>
                <button class="btn btn-secondary btn-lewati" ${!currentTicket ? 'disabled' : ''}>Lewati</button>
                <button class="btn btn-success btn-selesai" ${!currentTicket ? 'disabled' : ''}>Selesai</button>
            </div>
            ${waitingCount === 0 && !currentTicket ? '<div class="mt-3 text-muted" style="font-size: 0.85rem;">Tidak ada antrian menunggu.</div>' : ''}
        `;
        const btnPanggil = card.querySelector('.btn-panggil');
        const btnLewati = card.querySelector('.btn-lewati');
        const btnSelesai = card.querySelector('.btn-selesai');
        if (!nextTicket && !currentTicket) {
            btnPanggil.disabled = true;
        }
        btnPanggil.addEventListener('click', () => this.handleCallNext(queue.code, currentTicket === null || currentTicket === void 0 ? void 0 : currentTicket.id, nextTicket === null || nextTicket === void 0 ? void 0 : nextTicket.id));
        btnLewati.addEventListener('click', () => this.handleAction(currentTicket === null || currentTicket === void 0 ? void 0 : currentTicket.id, 'Dilewati'));
        btnSelesai.addEventListener('click', () => this.handleAction(currentTicket === null || currentTicket === void 0 ? void 0 : currentTicket.id, 'Selesai'));
        this.gridContainer.appendChild(card);
    }
    handleCallNext(queueCode, currentTicketId, nextTicketId) {
        const tickets = StorageManager.getTickets();
        if (currentTicketId) {
            const currentIdx = tickets.findIndex(t => t.id === currentTicketId);
            if (currentIdx !== -1)
                tickets[currentIdx].status = 'Selesai';
        }
        if (nextTicketId) {
            const nextIdx = tickets.findIndex(t => t.id === nextTicketId);
            if (nextIdx !== -1)
                tickets[nextIdx].status = 'Dipanggil';
        }
        StorageManager.setTickets(tickets);
        StorageManager.triggerUpdate();
        this.renderPanel();
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
}
document.addEventListener('DOMContentLoaded', () => {
    new OperatorPanel();
});
