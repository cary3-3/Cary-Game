// Симуляция базы данных через LocalStorage
class Database {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('carygame_users')) || [];
        this.transactions = JSON.parse(localStorage.getItem('carygame_transactions')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('carygame_currentUser')) || null;
        
        // Автоматически обновляем текущего пользователя из базы
        if (this.currentUser) {
            this.updateCurrentUserFromDB();
        }
    }

    // Обновляем текущего пользователя из базы данных
    updateCurrentUserFromDB() {
        if (this.currentUser && this.currentUser.id) {
            const freshUser = this.users.find(u => u.id === this.currentUser.id);
            if (freshUser) {
                this.currentUser = freshUser;
                this.saveCurrentUser();
            }
        }
    }

    // Обновляем баланс с автоматическим обновлением текущего пользователя
    updateUserBalance(userId, amount) {
        console.log(`Updating balance for user ${userId}: ${amount} ₽`);
        
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.balance += amount;
            user.balance = Math.max(0, user.balance); // Не даем уйти в минус
            this.saveUsers();
            
            // Обновляем текущего пользователя если это он
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser.balance = user.balance;
                this.saveCurrentUser();
            }
            
            console.log(`New balance: ${user.balance} ₽`);
            return user.balance;
        }
        return null;
    }

    // Обновляем метод пополнения
    createDeposit(userId, amount) {
        const transaction = {
            id: Date.now().toString(),
            userId,
            type: 'deposit',
            amount: parseInt(amount),
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        this.transactions.push(transaction);
        this.saveTransactions();
        return transaction;
    }

    // Обновляем метод вывода
    createWithdraw(userId, amount, method) {
        const transaction = {
            id: Date.now().toString(),
            userId,
            type: 'withdraw',
            amount: parseInt(amount),
            method,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        this.transactions.push(transaction);
        this.saveTransactions();
        
        // Сразу списываем средства при создании заявки на вывод
        this.updateUserBalance(userId, -parseInt(amount));
        
        return transaction;
    }

    // Обновляем метод одобрения транзакций
    updateTransactionStatus(transactionId, status) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (transaction) {
            transaction.status = status;
            
            if (status === 'approved') {
                if (transaction.type === 'deposit') {
                    // При одобрении пополнения - зачисляем средства
                    this.updateUserBalance(transaction.userId, transaction.amount);
                }
                // Для вывода средства уже списаны при создании заявки
            } else if (status === 'rejected') {
                if (transaction.type === 'withdraw') {
                    // При отклонении вывода - возвращаем средства
                    this.updateUserBalance(transaction.userId, transaction.amount);
                }
            }
            
            this.saveTransactions();
            this.saveUsers();
        }
    }

    saveUsers() {
        localStorage.setItem('carygame_users', JSON.stringify(this.users));
        console.log('Users saved to localStorage');
    }

    saveTransactions() {
        localStorage.setItem('carygame_transactions', JSON.stringify(this.transactions));
    }

    saveCurrentUser() {
        localStorage.setItem('carygame_currentUser', JSON.stringify(this.currentUser));
    }

    registerUser(username, password) {
        const user = {
            id: Date.now().toString(),
            username,
            password: btoa(password),
            balance: 5000, // Увеличил стартовый баланс
            createdAt: new Date().toISOString()
        };
        this.users.push(user);
        this.saveUsers();
        return user;
    }

    loginUser(username, password) {
        const user = this.users.find(u => u.username === username && u.password === btoa(password));
        if (user) {
            this.currentUser = user;
            this.saveCurrentUser();
        }
        return user;
    }

    logoutUser() {
        this.currentUser = null;
        this.saveCurrentUser();
    }

    getUserTransactions(userId) {
        return this.transactions.filter(t => t.userId === userId);
    }
}

const db = new Database();

// Функция обновления интерфейса пользователя
function updateUserInfo() {
    if (db.currentUser) {
        const usernameElement = document.getElementById('username');
        const balanceElement = document.getElementById('balance');
        
        if (usernameElement) {
            usernameElement.textContent = db.currentUser.username;
        }
        if (balanceElement) {
            balanceElement.textContent = db.currentUser.balance + ' ₽';
        }
        console.log('User info updated:', db.currentUser.username, db.currentUser.balance + ' ₽');
    }
}

function logout() {
    db.logoutUser();
    window.location.href = 'login.html';
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initialized');
    
    if (window.location.pathname.includes('admin.html')) {
        // Админ панель
    } else if (window.location.pathname.includes('login.html')) {
        // Логин
    } else if (window.location.pathname.includes('register.html')) {
        // Регистрация
    } else {
        // Главная страница
        if (!db.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        updateUserInfo();
    }
});
