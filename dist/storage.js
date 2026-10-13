export class StorageManager {
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
    static getQueueTypes() {
        const data = localStorage.getItem('queueTypes');
        return data ? JSON.parse(data) : [];
    }
    static setQueueTypes(types) {
        localStorage.setItem('queueTypes', JSON.stringify(types));
    }
    static getTickets() {
        const data = localStorage.getItem('tickets');
        return data ? JSON.parse(data) : [];
    }
    static setTickets(tickets) {
        localStorage.setItem('tickets', JSON.stringify(tickets));
    }
    static triggerUpdate() {
        window.dispatchEvent(new Event('storageUpdated'));
    }
}
