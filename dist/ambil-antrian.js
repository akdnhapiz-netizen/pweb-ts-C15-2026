import { StorageManager } from './storage.js';
class TakeQueuePage {
    constructor() {
        this.serviceGrid = document.getElementById('serviceGrid');
        this.btnTake = document.getElementById('btnTake');
        this.errorBox = document.getElementById('takeError');
        this.modal = document.getElementById('ticketModal');
        this.ticketNumber = document.getElementById('ticketNumber');
        this.ticketService = document.getElementById('ticketService');
        this.ticketWaiting = document.getElementById('ticketWaiting');
        this.ticketTime = document.getElementById('ticketTime');
        this.btnPrint = document.getElementById('btnPrint');
        this.btnClose = document.getElementById('btnClose');
        this.selectedCode = null;
        this.lastSnapshot = '';
        this.initEvents();
        this.renderServices();
        window.addEventListener('storage', () => this.renderServices());
        window.addEventListener('storageUpdated', () => this.renderServices());
        setInterval(() => this.renderServices(), 2000);
    }
    initEvents() {
        this.btnTake.addEventListener('click', () => this.handleTake());
        this.btnPrint.addEventListener('click', () => window.print());
        this.btnClose.addEventListener('click', () => this.handleClose());
    }
    renderServices() {
        const queues = StorageManager.getQueueTypes();
        const snapshot = JSON.stringify(queues) + this.selectedCode;
        if (snapshot === this.lastSnapshot)
            return;
        this.lastSnapshot = snapshot;
        const stillValid = queues.some(q => q.code === this.selectedCode && q.isActive);
        if (!stillValid)
            this.selectedCode = null;
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
    createServiceCard(queue) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'service-card';
        card.disabled = !queue.isActive;
        if (queue.code === this.selectedCode)
            card.classList.add('selected');
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
    getSelectedPriority() {
        var _a;
        const checked = document.querySelector('input[name="priority"]:checked');
        return ((_a = checked === null || checked === void 0 ? void 0 : checked.value) !== null && _a !== void 0 ? _a : 'Normal');
    }
    createTicket(queue, priority) {
        const tickets = StorageManager.getTickets();
        const lastNumber = tickets
            .filter(t => t.queueCode === queue.code)
            .reduce((max, t) => Math.max(max, t.ticketNumber), 0);
        const nextNumber = lastNumber + 1;
        const ticket = {
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
    handleTake() {
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
    handleClose() {
        this.modal.hidden = true;
        this.selectedCode = null;
        const normal = document.querySelector('input[name="priority"][value="Normal"]');
        if (normal)
            normal.checked = true;
        this.renderServices();
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new TakeQueuePage();
});
