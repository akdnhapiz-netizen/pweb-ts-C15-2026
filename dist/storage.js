export class StorageManager {
    // --- AUTHENTICATION ---
    static getAuth() {
        const data = localStorage.getItem('authData');
        return data ? JSON.parse(data) : null;
    }
    static setAuth(data) {
        localStorage.setItem('authData', JSON.stringify(data));
    }
    static clearAuth() {
        localStorage.removeItem('authData');
    }
    // --- QUEUE TYPES (MASTER DATA) ---
    static getQueueTypes() {
        const data = localStorage.getItem('queueTypes');
        return data ? JSON.parse(data) : [];
    }
    static setQueueTypes(types) {
        localStorage.setItem('queueTypes', JSON.stringify(types));
    }
    // --- TICKETS ---
    static getTickets() {
        const data = localStorage.getItem('tickets');
        return data ? JSON.parse(data) : [];
    }
    static setTickets(tickets) {
        localStorage.setItem('tickets', JSON.stringify(tickets));
    }
    // Fungsi bantuan untuk men-trigger sinkronisasi antar tab/halaman
    static triggerUpdate() {
        window.dispatchEvent(new Event('storageUpdated'));
    }
}
