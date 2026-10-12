import { StorageManager } from './storage.js';
import type { QueueType, Ticket, Priority } from './storage.js';

class AdminPage {
    private userName = document.getElementById('userName') as HTMLSpanElement;
    private userRole = document.getElementById('userRole') as HTMLSpanElement;

    private serviceForm = document.getElementById('serviceForm') as HTMLFormElement;
    private serviceCode = document.getElementById('serviceCode') as HTMLInputElement;
    private serviceName = document.getElementById('serviceName') as HTMLInputElement;
    private serviceList = document.getElementById('serviceList') as HTMLDivElement;

    private ticketForm = document.getElementById('ticketForm') as HTMLFormElement;
    private ticketService = document.getElementById('ticketService') as HTMLSelectElement;
    private ticketPriority = document.getElementById('ticketPriority') as HTMLSelectElement;

    private messageBox = document.getElementById('messageBox') as HTMLDivElement;
    private btnReset = document.getElementById('btnReset') as HTMLButtonElement;
    private btnLogout = document.getElementById('btnLogout') as HTMLButtonElement;

    constructor() {
        const auth = StorageManager.getAuth();

        // Hanya admin dan moderator yang boleh masuk.
        if (
            !auth ||
            (auth.role !== 'admin' && auth.role !== 'moderator')
        ) {
            window.location.replace('login.html');
            return;
        }

        this.userName.textContent = auth.firstName;
        this.userRole.textContent = auth.role;

        this.serviceForm.addEventListener('submit', (event) => {
            this.addService(event);
        });

        this.ticketForm.addEventListener('submit', (event) => {
            this.addManualTicket(event);
        });

        this.btnReset.addEventListener('click', () => {
            this.resetTickets();
        });

        this.btnLogout.addEventListener('click', () => {
            StorageManager.clearAuth();
            window.location.href = 'login.html';
        });

        window.addEventListener('storageUpdated', () => {
            this.renderServices();
        });

        window.addEventListener('storage', (event) => {
            if (event.key === 'queueTypes' || event.key === 'tickets') {
                this.renderServices();
            }
        });

        this.renderServices();
    }

    
private showMessage(message: string, success: boolean = false): void {
    this.messageBox.textContent = message;

    this.messageBox.className = success
        ? 'alert alert-success'
        : 'alert alert-danger';

    this.messageBox.hidden = false;

    // Pindahkan tampilan ke notifikasi agar langsung terlihat.
    this.messageBox.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}


    private addService(event: SubmitEvent): void {
        event.preventDefault();

        const code = this.serviceCode.value.trim().toUpperCase();
        const name = this.serviceName.value.trim();

        // Kode harus tepat satu huruf kapital A-Z.
        if (!/^[A-Z]$/.test(code)) {
            this.showMessage('Kode harus tepat satu huruf kapital A-Z.');
            return;
        }

        if (name === '') {
            this.showMessage('Nama layanan wajib diisi.');
            return;
        }

        const services = StorageManager.getQueueTypes();

        const duplicateCode = services.some(
            (service) => service.code.toUpperCase() === code
        );

        const duplicateName = services.some(
            (service) => service.name.trim().toLowerCase() === name.toLowerCase()
        );

        if (duplicateCode) {
            this.showMessage('Kode layanan sudah digunakan.');
            return;
        }

        if (duplicateName) {
            this.showMessage('Nama layanan sudah digunakan.');
            return;
        }

        const newService: QueueType = {
            code: code,
            name: name,
            isActive: true
        };

        services.push(newService);

        StorageManager.setQueueTypes(services);
        StorageManager.triggerUpdate();

        this.serviceForm.reset();
        this.renderServices();
        this.showMessage('Layanan berhasil ditambahkan.', true);
    }

    private renderServices(): void {
        const services = StorageManager.getQueueTypes();

        this.serviceList.replaceChildren();
        this.ticketService.replaceChildren();

        if (services.length === 0) {
            const empty = document.createElement('p');
            empty.textContent = 'Belum ada layanan.';
            this.serviceList.appendChild(empty);
        }

        services.forEach((service) => {
            const card = document.createElement('div');
            card.className = 'card';

            const title = document.createElement('h3');
            title.textContent = service.code + ' - ' + service.name;

            const status = document.createElement('p');
            status.textContent = service.isActive
                ? 'Status: Aktif'
                : 'Status: Nonaktif';

            const toggleButton = document.createElement('button');
            toggleButton.type = 'button';
            toggleButton.className = 'btn btn-primary';
            toggleButton.textContent = service.isActive
                ? 'Nonaktifkan'
                : 'Aktifkan';

            toggleButton.addEventListener('click', () => {
                this.toggleService(service.code);
            });

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'btn btn-danger';
            deleteButton.textContent = 'Hapus';

            deleteButton.addEventListener('click', () => {
                this.deleteService(service.code);
            });

            card.appendChild(title);
            card.appendChild(status);
            card.appendChild(toggleButton);
            card.appendChild(deleteButton);

            this.serviceList.appendChild(card);

            // Hanya layanan aktif yang dapat dipilih.
            if (service.isActive) {
                const option = document.createElement('option');
                option.value = service.code;
                option.textContent = service.code + ' - ' + service.name;
                this.ticketService.appendChild(option);
            }
        });

        const submitButton = this.ticketForm.querySelector(
            'button[type="submit"]'
        ) as HTMLButtonElement | null;

        if (submitButton) {
            submitButton.disabled = this.ticketService.options.length === 0;
        }
    }

    private toggleService(code: string): void {
        const services = StorageManager.getQueueTypes();

        const service = services.find((item) => item.code === code);

        if (!service) {
            this.showMessage('Layanan tidak ditemukan.');
            return;
        }

        service.isActive = !service.isActive;

        StorageManager.setQueueTypes(services);
        StorageManager.triggerUpdate();

        this.renderServices();

        this.showMessage(
            'Layanan berhasil ' +
            (service.isActive ? 'diaktifkan.' : 'dinonaktifkan.'),
            true
        );
    }

    private deleteService(code: string): void {
        const services = StorageManager.getQueueTypes();
        const service = services.find((item) => item.code === code);

        if (!service) {
            this.showMessage('Layanan tidak ditemukan.');
            return;
        }

        const confirmed = window.confirm(
            'Apakah kamu yakin ingin menghapus layanan ' + service.name + '?'
        );

        if (!confirmed) {
            return;
        }

        const updatedServices = services.filter(
            (item) => item.code !== code
        );

        StorageManager.setQueueTypes(updatedServices);
        StorageManager.triggerUpdate();

        this.renderServices();
        this.showMessage('Layanan berhasil dihapus.', true);
    }

    private addManualTicket(event: SubmitEvent): void {
    event.preventDefault();

    console.log('Tombol Terbitkan Tiket berhasil ditekan.');

        const code = this.ticketService.value;
        const priority = this.ticketPriority.value as Priority;

        const services = StorageManager.getQueueTypes();

        const service = services.find(
            (item) => item.code === code && item.isActive
        );
            console.log('Kode layanan:', code);
            console.log('Prioritas:', priority);
            console.log('Layanan ditemukan:', service);
            if (!service) {
            this.showMessage('Pilih layanan yang masih aktif.');
            this.renderServices();
            return;
        }

        const validPriorities = [
    'Normal',
    'Lansia',
    'Disabilitas',
    'VIP'
];

if (
    priority !== 'Normal' &&
    priority !== 'Lansia' &&
    priority !== 'Disabilitas' &&
    priority !== 'VIP'
) {
    this.showMessage('Prioritas tiket tidak valid.');
    return;
}

        const tickets = StorageManager.getTickets();

        // Mencari nomor terakhir pada layanan yang dipilih.
        const lastNumber = tickets.reduce((max, ticket) => {
            if (ticket.queueCode === code && ticket.ticketNumber > max) {
                return ticket.ticketNumber;
            }

            return max;
        }, 0);

        const nextNumber = lastNumber + 1;

        // Menggunakan slice agar tidak bergantung pada padStart.
        const numberText = ('000' + nextNumber).slice(-3);

        const newTicket: Ticket = {
            id: code + '-' + Date.now(),
            queueCode: code,
            ticketNumber: nextNumber,
            displayNumber: code + '-' + numberText,
            priority: priority,
            status: 'Menunggu',
            serviceName: service.name,
            createdAt: Date.now()
        };

        tickets.push(newTicket);

        StorageManager.setTickets(tickets);
        StorageManager.triggerUpdate();

        this.ticketForm.reset();
        this.renderServices();

        this.showMessage(
    'Tiket ' + newTicket.displayNumber +
    ' berhasil diterbitkan dengan prioritas ' +
    newTicket.priority + '.',
    true
);
    }

    private resetTickets(): void {
        const confirmed = window.confirm(
            'Yakin ingin menghapus semua tiket antrean?'
        );

        if (!confirmed) {
            return;
        }

        StorageManager.setTickets([]);
        StorageManager.triggerUpdate();

        this.showMessage(
            'Semua tiket berhasil dihapus. Nomor antrean kembali ke 001.',
            true
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminPage();
});