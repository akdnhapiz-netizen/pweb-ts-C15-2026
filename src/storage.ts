export type Role = 'admin' | 'moderator' | 'user';
export type Priority = 'Normal' | 'Lansia' | 'Disabilitas' | 'VIP';
export type TicketStatus = 'Menunggu' | 'Dipanggil' | 'Selesai' | 'Dilewati';

export interface QueueType {
    code: string; // Tepat 1 huruf kapital (misal: 'A')
    name: string; // Nama layanan (misal: 'Poli Umum')
    isActive: boolean;
}

export interface Ticket {
    id: string; 
    queueCode: string;
    ticketNumber: number; // Urutan angka, misal: 1
    displayNumber: string; // Format cetak, misal: 'A-001'
    priority: Priority;
    status: TicketStatus;
    serviceName: string;
    createdAt: number; 
}

export interface AuthData {
    token: string;
    role: Role;
    firstName: string;
}

export class StorageManager {
    // --- AUTHENTICATION ---
    static getAuth(): AuthData | null {
        const data = localStorage.getItem('authData');
        return data ? JSON.parse(data) : null;
    }
    static setAuth(data: AuthData): void {
        localStorage.setItem('authData', JSON.stringify(data));
    }
    static clearAuth(): void {
        localStorage.removeItem('authData');
    }

    // --- QUEUE TYPES (MASTER DATA) ---
    static getQueueTypes(): QueueType[] {
        const data = localStorage.getItem('queueTypes');
        return data ? JSON.parse(data) : [];
    }
    static setQueueTypes(types: QueueType[]): void {
        localStorage.setItem('queueTypes', JSON.stringify(types));
    }

    // --- TICKETS ---
    static getTickets(): Ticket[] {
        const data = localStorage.getItem('tickets');
        return data ? JSON.parse(data) : [];
    }
    static setTickets(tickets: Ticket[]): void {
        localStorage.setItem('tickets', JSON.stringify(tickets));
    }
    
    // Fungsi bantuan untuk men-trigger sinkronisasi antar tab/halaman
    static triggerUpdate(): void {
        window.dispatchEvent(new Event('storageUpdated'));
    }
}