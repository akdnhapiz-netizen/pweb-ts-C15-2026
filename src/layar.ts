import { StorageManager, QueueType, Ticket } from './storage.js';

class LayarAntrian {
    private gridContainer = document.getElementById('layarGrid') as HTMLDivElement;
    private btnFullscreen = document.getElementById('btnFullscreen') as HTMLButtonElement;
    private lastUpdated = document.getElementById('lastUpdated') as HTMLSpanElement;

    constructor() {
        this.initEvents();

        this.renderLayar();

        setInterval(() => {
            this.renderLayar();
        }, 2500); 
    }

    private initEvents(): void {
        this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    }

    private renderLayar(): void {
        const queues = StorageManager.getQueueTypes().filter(q => q.isActive);
        const tickets = StorageManager.getTickets();

        this.gridContainer.innerHTML = '';

        if (queues.length === 0) {
            this.gridContainer.innerHTML = `
                <div class="text-center text-muted w-100" style="grid-column: 1 / -1; margin-top: 100px;">
                    <h2 style="font-size: 2.5rem; color: var(--text-muted);">Belum ada antrian yang aktif.</h2>
                    <p style="font-size: 1.5rem;">Silakan tunggu instruksi dari petugas.</p>
                </div>`;
            this.updateTimestamp();
            return;
        }

        queues.forEach(queue => {
            const queueTickets = tickets.filter(t => t.queueCode === queue.code);
            
            const currentTicket = queueTickets.find(t => t.status === 'Dipanggil');
            
            const waitingCount = queueTickets.filter(t => t.status === 'Menunggu').length;

            this.createLayarCard(queue, currentTicket, waitingCount);
        });

        this.updateTimestamp();
    }

    private createLayarCard(queue: QueueType, currentTicket: Ticket | undefined, waitingCount: number): void {
        const card = document.createElement('div');
        card.className = currentTicket ? 'card ticket-active' : 'card';
        card.style.textAlign = 'center';
        card.style.padding = '3rem 2rem';
        card.style.borderRadius = '15px';

        let ticketDisplayHtml = '';
        
        if (currentTicket) {
            ticketDisplayHtml = `
                <div class="status-badge status-dipanggil" style="margin-bottom: 1.5rem; display: inline-block; font-size: 1rem; padding: 0.5rem 1rem;">SEDANG DIPANGGIL</div>
                <div style="font-size: 6rem; font-weight: 800; color: var(--primary); line-height: 1; letter-spacing: -2px;">${currentTicket.displayNumber}</div>
            `;
        } else {
            ticketDisplayHtml = `
                <div style="margin-bottom: 1.5rem; color: transparent; font-size: 1rem; padding: 0.5rem 1rem;">-</div>
                <div style="font-size: 2rem; font-weight: 500; color: #adb5bd; padding: 2rem 0;">Belum ada antrian</div>
            `;
        }

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--secondary); padding-bottom: 15px; margin-bottom: 30px;">
                <h3 style="margin: 0; font-size: 1.8rem; color: var(--dark);">${queue.name}</h3>
                <span style="background: var(--secondary); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; color: var(--text-muted);">${queue.code}</span>
            </div>
            
            ${ticketDisplayHtml}
            
            <div style="margin-top: 3rem; border-top: 2px solid var(--secondary); padding-top: 20px;">
                <span class="text-muted" style="font-size: 1.3rem; font-weight: 500;">Sisa antrian: <strong>${waitingCount}</strong> orang</span>
            </div>
        `;

        this.gridContainer.appendChild(card);
    }

    private updateTimestamp(): void {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', { hour12: false }).replace(/:/g, '.');
        this.lastUpdated.textContent = `Diperbarui ${timeString}`;
    }

    private toggleFullscreen(): void {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
                alert("Browser Anda memblokir fitur Layar Penuh. Coba klik di area kosong terlebih dahulu.");
            });
            this.btnFullscreen.textContent = "Keluar Layar Penuh";
            this.btnFullscreen.classList.replace('btn-primary', 'btn-secondary');
        } else {
            document.exitFullscreen();
            this.btnFullscreen.textContent = "Layar Penuh";
            this.btnFullscreen.classList.replace('btn-secondary', 'btn-primary');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LayarAntrian();
});