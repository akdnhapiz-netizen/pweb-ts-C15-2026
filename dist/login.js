var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { StorageManager } from './storage.js';
class LoginPage {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.inputUsername = document.getElementById('username');
        this.inputPassword = document.getElementById('password');
        this.btnLogin = document.getElementById('btnLogin');
        this.spinner = document.getElementById('loginSpinner');
        this.btnText = document.getElementById('loginText');
        this.errorBox = document.getElementById('loginError');
        this.demoBox = document.getElementById('demoBox');
        this.demoList = document.getElementById('demoList');
        const auth = StorageManager.getAuth();
        if (auth) {
            this.redirectByRole(auth.role);
            return;
        }
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.loadDemoUsers();
    }
    redirectByRole(role) {
        if (role === 'admin' || role === 'moderator') {
            window.location.href = 'index.html';
        }
        else {
            window.location.href = 'operator.html';
        }
    }
    setLoading(loading) {
        this.btnLogin.disabled = loading;
        this.inputUsername.disabled = loading;
        this.inputPassword.disabled = loading;
        this.spinner.hidden = !loading;
        this.btnText.textContent = loading ? 'Memverifikasi...' : 'Masuk';
    }
    showError(message) {
        this.errorBox.textContent = message;
        this.errorBox.hidden = false;
    }
    handleSubmit(e) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const resLogin = yield fetch('https://dummyjson.com/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username, password: password }),
                });
                if (!resLogin.ok) {
                    throw new Error('Username atau password salah.');
                }
                const loginData = yield resLogin.json();
                const resMe = yield fetch('https://dummyjson.com/auth/me', {
                    headers: { Authorization: `Bearer ${loginData.accessToken}` },
                });
                if (!resMe.ok) {
                    throw new Error('Gagal mengambil data pengguna.');
                }
                const userData = yield resMe.json();
                StorageManager.setAuth({
                    token: loginData.accessToken,
                    role: userData.role,
                    firstName: userData.firstName,
                });
                this.redirectByRole(userData.role);
            }
            catch (err) {
                if (err instanceof TypeError) {
                    this.showError('Koneksi gagal. Periksa internet kamu lalu coba lagi.');
                }
                else if (err instanceof Error) {
                    this.showError(err.message);
                }
                this.setLoading(false);
            }
        });
    }
    fetchUsersByRole(role) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield fetch(`https://dummyjson.com/users/filter?key=role&value=${role}`);
            if (!res.ok)
                throw new Error('Gagal memuat akun demo');
            const data = yield res.json();
            return data.users.slice(0, 3);
        });
    }
    loadDemoUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [admins, users] = yield Promise.all([
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
            }
            catch (_a) {
                this.demoBox.hidden = true;
            }
        });
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});
