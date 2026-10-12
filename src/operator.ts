import { StorageManager, Priority, TicketStatus } from './storage.js';

class OperatorPanel {
    private gridContainer = document.getElementById('operatorGrid') as HTMLDivElement;
    private btnLogout = document.getElementById('btnLogout') as HTMLButtonElement;
    private operatorName = document.getElementById('operatorName') as HTMLSpanElement;

    constructor() {
        this.checkAuth();
        this.initEvents();
        this.renderPanel();

        window.addEventListener('storage', () => this.renderPanel());
        window.addEventListener('storageUpdated', () => this.renderPanel());
        
        setInterval(() => this.renderPanel(), 3000);
    }

    private checkAuth(): void {
        const auth = StorageManager.getAuth();
        if (!auth) {
            window.location.href = 'login.html';
            return;
        }
        this.operatorName.textContent = `Halo, ${auth.firstName}`;
    }

    private initEvents(): void {
        this.btnLogout.addEventListener('click', () => {
            StorageManager.clearAuth();
            window.location.href = 'login.html';
        });
    }

    private getPriorityWeight(priority: Priority): number {
        switch (priority) {
            case 'VIP': return 4;
            case 'Disabilitas': return 3;
            case 'Lansia': return 2;
            case 'Normal': return 1;
            default: return 0;
        }
    }

    private renderPanel(): void {
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
                    if (weightDiff !== 0) return weightDiff; 
                    return a.createdAt - b.createdAt; 
                });

            const nextTicket = waitingTickets.length > 0 ? waitingTickets[0] : null;
            const waitingCount = waitingTickets.length;

            this.createOperatorCard(queue, currentTicket, nextTicket, waitingCount);
        });
    }

    private createOperatorCard(queue: any, currentTicket: any, nextTicket: any, waitingCount: number): void {
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

        const btnPanggil = card.querySelector('.btn-panggil') as HTMLButtonElement;
        const btnLewati = card.querySelector('.btn-lewati') as HTMLButtonElement;
        const btnSelesai = card.querySelector('.btn-selesai') as HTMLButtonElement;

        if (!nextTicket && !currentTicket) {
            btnPanggil.disabled = true;
        }

        btnPanggil.addEventListener('click', () => this.handleCallNext(queue.code, currentTicket?.id, nextTicket?.id));
        btnLewati.addEventListener('click', () => this.handleAction(currentTicket?.id, 'Dilewati'));
        btnSelesai.addEventListener('click', () => this.handleAction(currentTicket?.id, 'Selesai'));

        this.gridContainer.appendChild(card);
    }

    private handleCallNext(queueCode: string, currentTicketId: string | undefined, nextTicketId: string | undefined): void {
        const tickets = StorageManager.getTickets();
        
        if (currentTicketId) {
            const currentIdx = tickets.findIndex(t => t.id === currentTicketId);
            if (currentIdx !== -1) tickets[currentIdx].status = 'Selesai';
        }

        if (nextTicketId) {
            const nextIdx = tickets.findIndex(t => t.id === nextTicketId);
            if (nextIdx !== -1) tickets[nextIdx].status = 'Dipanggil';
        }

        StorageManager.setTickets(tickets);
        StorageManager.triggerUpdate(); 
        this.renderPanel();
    }

    private handleAction(ticketId: string | undefined, targetStatus: TicketStatus): void {
        if (!ticketId) return;
        
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