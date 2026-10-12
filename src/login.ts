import { StorageManager } from './storage.js';
import type { Role } from './storage.js';

interface LoginResponse {
    accessToken: string;
    firstName: string;
}

interface UserResponse {
    firstName: string;
    role: Role;
}

interface DemoUser {
    firstName: string;
    username: string;
    password: string;
    role: Role;
}

class LoginPage {
    private form = document.getElementById('loginForm') as HTMLFormElement;
    private inputUsername = document.getElementById('username') as HTMLInputElement;
    private inputPassword = document.getElementById('password') as HTMLInputElement;
    private btnLogin = document.getElementById('btnLogin') as HTMLButtonElement;
    private spinner = document.getElementById('loginSpinner') as HTMLSpanElement;
    private btnText = document.getElementById('loginText') as HTMLSpanElement;
    private errorBox = document.getElementById('loginError') as HTMLDivElement;
    private demoBox = document.getElementById('demoBox') as HTMLDivElement;
    private demoList = document.getElementById('demoList') as HTMLDivElement;

    constructor() {
        const auth = StorageManager.getAuth();
        if (auth) {
            this.redirectByRole(auth.role);
            return;
        }

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.loadDemoUsers();
    }

    private redirectByRole(role: Role): void {
        if (role === 'admin' || role === 'moderator') {
            window.location.href = 'index.html';
        } else {
            window.location.href = 'operator.html';
        }
    }

    private setLoading(loading: boolean): void {
        this.btnLogin.disabled = loading;
        this.inputUsername.disabled = loading;
        this.inputPassword.disabled = loading;
        this.spinner.hidden = !loading;
        this.btnText.textContent = loading ? 'Memverifikasi...' : 'Masuk';
    }

    private showError(message: string): void {
        this.errorBox.textContent = message;
        this.errorBox.hidden = false;
    }

    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault();
        this.errorBox.hidden = true;

        const username = this.inputUsername.value.trim();
        const password = this.inputPassword.value;

        if (username === '' || password === '') {
            this.showError('Username dan password wajib diisi.');
            return;
        }

        this.setLoading(true);

        try {
            const resLogin = await fetch('https://dummyjson.com/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password }),
            });

            if (!resLogin.ok) {
                throw new Error('Username atau password salah.');
            }

            const loginData: LoginResponse = await resLogin.json();

            const resMe = await fetch('https://dummyjson.com/auth/me', {
                headers: { Authorization: `Bearer ${loginData.accessToken}` },
            });

            if (!resMe.ok) {
                throw new Error('Gagal mengambil data pengguna.');
            }

            const userData: UserResponse = await resMe.json();

            StorageManager.setAuth({
                token: loginData.accessToken,
                role: userData.role,
                firstName: userData.firstName,
            });

            this.redirectByRole(userData.role);
        } catch (err) {
            if (err instanceof TypeError) {
                this.showError('Koneksi gagal. Periksa internet kamu lalu coba lagi.');
            } else if (err instanceof Error) {
                this.showError(err.message);
            }
            this.setLoading(false);
        }
    }

    private async fetchUsersByRole(role: string): Promise<DemoUser[]> {
        const res = await fetch(`https://dummyjson.com/users/filter?key=role&value=${role}`);
        if (!res.ok) throw new Error('Gagal memuat akun demo');
        const data: { users: DemoUser[] } = await res.json();
        return data.users.slice(0, 3);
    }

    private async loadDemoUsers(): Promise<void> {
        try {
            const [admins, users] = await Promise.all([
                this.fetchUsersByRole('admin'),
                this.fetchUsersByRole('user'),
            ]);

            [...admins, ...users].forEach(user => {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'demo-chip';

                const name = document.createElement('strong');
                name.textContent = user.firstName;
                const role = document.createElement('small');
                role.textContent = user.role;
                chip.append(name, role);

                chip.addEventListener('click', () => {
                    this.inputUsername.value = user.username;
                    this.inputPassword.value = user.password;
                    this.errorBox.hidden = true;
                    this.inputPassword.focus();
                });

                this.demoList.appendChild(chip);
            });

            this.demoBox.hidden = false;
        } catch {
            this.demoBox.hidden = true;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});