import { StorageManager } from './storage.js';
import type { Priority, QueueType, Ticket } from './storage.js';

class TakeQueuePage {
    private serviceGrid = document.getElementById('serviceGrid') as HTMLDivElement;
    private btnTake = document.getElementById('btnTake') as HTMLButtonElement;
    private errorBox = document.getElementById('takeError') as HTMLDivElement;
    private modal = document.getElementById('ticketModal') as HTMLDivElement;
    private ticketNumber = document.getElementById('ticketNumber') as HTMLParagraphElement;
    private ticketService = document.getElementById('ticketService') as HTMLParagraphElement;
    private ticketWaiting = document.getElementById('ticketWaiting') as HTMLParagraphElement;
    private ticketTime = document.getElementById('ticketTime') as HTMLParagraphElement;
    private btnPrint = document.getElementById('btnPrint') as HTMLButtonElement;
    private btnClose = document.getElementById('btnClose') as HTMLButtonElement;

    private selectedCode: string | null = null;
    private lastSnapshot = '';

    constructor() {
        this.initEvents();
        this.renderServices();

        window.addEventListener('storage', () => this.renderServices());
        window.addEventListener('storageUpdated', () => this.renderServices());

        setInterval(() => this.renderServices(), 2000);
    }

    private initEvents(): void {
        this.btnTake.addEventListener('click', () => this.handleTake());
        this.btnPrint.addEventListener('click', () => window.print());
        this.btnClose.addEventListener('click', () => this.handleClose());
    }

    private renderServices(): void {
        const queues = StorageManager.getQueueTypes();

        const snapshot = JSON.stringify(queues) + this.selectedCode;
        if (snapshot === this.lastSnapshot) return;
        this.lastSnapshot = snapshot;

        const stillValid = queues.some(q => q.code === this.selectedCode && q.isActive);
        if (!stillValid) this.selectedCode = null;

        this.serviceGrid.innerHTML = '';

        if (queues.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'text-muted';
            empty.textContent = 'Belum ada layanan yang tersedia.';
            this.serviceGrid.appendChild(empty);
        }

        queues.forEach(queue => this.serviceGrid.appendChild(this.createServiceCard(queue)));

        this.btnTake.disabled = this.selectedCode === null;
    }

    private createServiceCard(queue: QueueType): HTMLButtonElement {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'service-card';
        card.disabled = !queue.isActive;
        if (queue.code === this.selectedCode) card.classList.add('selected');

        const code = document.createElement('span');
        code.className = 'service-code';
        code.textContent = queue.code;

        const name = document.createElement('span');
        name.className = 'service-name';
        name.textContent = queue.name;

        card.append(code, name);

        if (!queue.isActive) {
            const info = document.createElement('small');
            info.textContent = 'Sedang tidak tersedia';
            card.appendChild(info);
        }

        card.addEventListener('click', () => {
            this.selectedCode = queue.code;
            this.errorBox.hidden = true;
            this.renderServices();
        });

        return card;
    }

    private getSelectedPriority(): Priority {
        const checked = document.querySelector<HTMLInputElement>('input[name="priority"]:checked');
        return (checked?.value ?? 'Normal') as Priority;
    }

    private createTicket(queue: QueueType, priority: Priority): Ticket {
        const tickets = StorageManager.getTickets();

        const lastNumber = tickets
            .filter(t => t.queueCode === queue.code)
            .reduce((max, t) => Math.max(max, t.ticketNumber), 0);
        const nextNumber = lastNumber + 1;

        const ticket: Ticket = {
            id: Date.now().toString() + Math.random().toString(16).slice(2),
            queueCode: queue.code,
            ticketNumber: nextNumber,
            displayNumber: `${queue.code}-${('00' + nextNumber).slice(-3)}`,
            priority: priority,
            status: 'Menunggu',
            serviceName: queue.name,
            createdAt: Date.now(),
        };

        tickets.push(ticket);
        StorageManager.setTickets(tickets);
        StorageManager.triggerUpdate();
        return ticket;
    }

    private handleTake(): void {
        this.errorBox.hidden = true;

        const queue = StorageManager.getQueueTypes().find(q => q.code === this.selectedCode);
        if (!queue || !queue.isActive) {
            this.errorBox.textContent = 'Layanan ini sudah tidak tersedia. Silakan pilih layanan lain.';
            this.errorBox.hidden = false;
            this.renderServices();
            return;
        }

        const ticket = this.createTicket(queue, this.getSelectedPriority());
        const waitingCount = StorageManager.getTickets()
            .filter(t => t.queueCode === queue.code && t.status === 'Menunggu').length;

        this.ticketNumber.textContent = ticket.displayNumber;
        this.ticketService.textContent = `${queue.name} · Prioritas ${ticket.priority}`;
        this.ticketWaiting.textContent = `Antrian menunggu di layanan ini: ${waitingCount}`;
        this.ticketTime.textContent = new Date(ticket.createdAt).toLocaleString('id-ID');
        this.modal.hidden = false;
        this.btnClose.focus();
    }

    private handleClose(): void {
        this.modal.hidden = true;
        this.selectedCode = null;
        const normal = document.querySelector<HTMLInputElement>('input[name="priority"][value="Normal"]');
        if (normal) normal.checked = true;
        this.renderServices();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TakeQueuePage();
});