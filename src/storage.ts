export type Role = 'admin' | 'moderator' | 'user';
export type Priority = 'Normal' | 'Lansia' | 'Disabilitas' | 'VIP';
export type TicketStatus = 'Menunggu' | 'Dipanggil' | 'Selesai' | 'Dilewati';

export interface QueueType {
    code: string;
    name: string;
    isActive: boolean;
}

export interface Ticket {
    id: string;
    queueCode: string;
    ticketNumber: number;
    displayNumber: string;
    priority: Priority;
    status: TicketStatus;
    serviceName: string;
    createdAt: number;
    calledAt?: number;
    skippedAt?: number;
}

export interface AuthData {
    token: string;
    role: Role;
    firstName: string;
}

export class StorageManager {
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

    static getQueueTypes(): QueueType[] {
        const data = localStorage.getItem('queueTypes');
        return data ? JSON.parse(data) : [];
    }
    static setQueueTypes(types: QueueType[]): void {
        localStorage.setItem('queueTypes', JSON.stringify(types));
    }

    static getTickets(): Ticket[] {
        const data = localStorage.getItem('tickets');
        return data ? JSON.parse(data) : [];
    }
    static setTickets(tickets: Ticket[]): void {
        localStorage.setItem('tickets', JSON.stringify(tickets));
    }

    static triggerUpdate(): void {
        window.dispatchEvent(new Event('storageUpdated'));
    }
}