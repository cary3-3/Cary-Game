class OnlineDatabase {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.currentUser = JSON.parse(localStorage.getItem('carygame_currentUser')) || null;
    }

    async request(endpoint, options = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            if (this.currentUser) {
                headers['user-id'] = this.currentUser.id;
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async registerUser(username, password) {
        const data = await this.request('/register', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        return data.user;
    }

    async loginUser(username, password) {
        const data = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        this.currentUser = data.user;
        localStorage.setItem('carygame_currentUser', JSON.stringify(this.currentUser));
        return this.currentUser;
    }

    async updateUserBalance(amount) {
        const data = await this.request('/balance', {
            method: 'POST',
            body: JSON.stringify({ amount })
        });
        
        if (this.currentUser) {
            this.currentUser.balance = data.balance;
            localStorage.setItem('carygame_currentUser', JSON.stringify(this.currentUser));
        }
        
        return data.balance;
    }

    async getBalance() {
        const data = await this.request('/balance');
        return data.balance;
    }

    async createDeposit(amount) {
        const data = await this.request('/deposit', {
            method: 'POST',
            body: JSON.stringify({ amount })
        });
        return data.transaction;
    }

    async createWithdraw(amount, method) {
        const data = await this.request('/withdraw', {
            method: 'POST',
            body: JSON.stringify({ amount, method })
        });
        
        if (this.currentUser) {
            this.currentUser.balance = data.balance;
            localStorage.setItem('carygame_currentUser', JSON.stringify(this.currentUser));
        }
        
        return data.transaction;
    }

    // Админ методы
    async getAdminUsers() {
        const data = await this.request('/admin/users');
        return data.users;
    }

    async getAdminTransactions() {
        const data = await this.request('/admin/transactions');
        return data.transactions;
    }

    async updateTransactionStatus(transactionId, status) {
        const data = await this.request(`/admin/transactions/${transactionId}/status`, {
            method: 'POST',
            body: JSON.stringify({ status })
        });
        return data.transaction;
    }

    async updateUserBalanceAdmin(userId, amount) {
        const data = await this.request(`/admin/users/${userId}/balance`, {
            method: 'POST',
            body: JSON.stringify({ amount })
        });
        return data.user;
    }

    logoutUser() {
        this.currentUser = null;
        localStorage.removeItem('carygame_currentUser');
    }
}

// Используем онлайн базу данных
const db = new OnlineDatabase();

// Остальные функции остаются похожими, но используют асинхронные методы...
