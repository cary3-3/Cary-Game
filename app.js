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
        
        console.log('Database initialized:', {
            users: this.users.length,
            transactions: this.transactions.length,
            currentUser: this.currentUser
        });
    }

    // Обновляем текущего пользователя из базы данных
    updateCurrentUserFromDB() {
        if (this.currentUser && this.currentUser.id) {
            const freshUser = this.users.find(u => u.id === this.currentUser.id);
            if (freshUser) {
                this.currentUser = freshUser;
                this.saveCurrentUser();
                console.log('Current user updated from DB:', this.currentUser.username);
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
            
            console.log(`New balance for ${user.username}: ${user.balance} ₽`);
            return user.balance;
        }
        return null;
    }

    // Получаем статистику системы
    getSystemStats() {
        const totalBalance = this.users.reduce((sum, user) => sum + user.balance, 0);
        const totalDeposits = this.transactions.filter(t => t.type === 'deposit' && t.status === 'approved').length;
        const totalWithdraws = this.transactions.filter(t => t.type === 'withdraw' && t.status === 'approved').length;
        const pendingDeposits = this.transactions.filter(t => t.type === 'deposit' && t.status === 'pending').length;
        const pendingWithdraws = this.transactions.filter(t => t.type === 'withdraw' && t.status === 'pending').length;
        
        return {
            totalUsers: this.users.length,
            totalBalance: totalBalance,
            totalDeposits: totalDeposits,
            totalWithdraws: totalWithdraws,
            pendingDeposits: pendingDeposits,
            pendingWithdraws: pendingWithdraws
        };
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
        console.log('Deposit created:', transaction);
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
        
        console.log('Withdraw created:', transaction);
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
            console.log(`Transaction ${transactionId} status updated to: ${status}`);
        }
    }

    // Получаем пользователя по ID
    getUserById(userId) {
        return this.users.find(u => u.id === userId);
    }

    // Получаем все транзакции пользователя
    getUserTransactions(userId) {
        return this.transactions.filter(t => t.userId === userId);
    }

    // Получаем все pending транзакции
    getPendingTransactions() {
        return {
            deposits: this.transactions.filter(t => t.type === 'deposit' && t.status === 'pending'),
            withdraws: this.transactions.filter(t => t.type === 'withdraw' && t.status === 'pending')
        };
    }

    saveUsers() {
        localStorage.setItem('carygame_users', JSON.stringify(this.users));
        console.log('Users saved to localStorage:', this.users.length, 'users');
    }

    saveTransactions() {
        localStorage.setItem('carygame_transactions', JSON.stringify(this.transactions));
        console.log('Transactions saved to localStorage:', this.transactions.length, 'transactions');
    }

    saveCurrentUser() {
        localStorage.setItem('carygame_currentUser', JSON.stringify(this.currentUser));
        if (this.currentUser) {
            console.log('Current user saved:', this.currentUser.username);
        }
    }

    registerUser(username, password) {
        // Проверяем, нет ли уже пользователя с таким именем
        if (this.users.find(u => u.username === username)) {
            throw new Error('Пользователь с таким именем уже существует');
        }
        
        const user = {
            id: Date.now().toString(),
            username,
            password: btoa(password),
            balance: 5000, // Стартовый баланс
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        this.users.push(user);
        this.saveUsers();
        console.log('New user registered:', username);
        return user;
    }

    loginUser(username, password) {
        const user = this.users.find(u => u.username === username && u.password === btoa(password));
        if (user) {
            user.lastLogin = new Date().toISOString();
            this.currentUser = user;
            this.saveCurrentUser();
            this.saveUsers(); // Сохраняем обновленного пользователя
            console.log('User logged in:', username);
        } else {
            console.log('Login failed for:', username);
        }
        return user;
    }

    logoutUser() {
        console.log('User logged out:', this.currentUser ? this.currentUser.username : 'Unknown');
        this.currentUser = null;
        this.saveCurrentUser();
    }

    // Получаем всех пользователей (для админки)
    getAllUsers() {
        return this.users.map(user => {
            const userTransactions = this.getUserTransactions(user.id);
            const totalDeposits = userTransactions
                .filter(t => t.type === 'deposit' && t.status === 'approved')
                .reduce((sum, t) => sum + t.amount, 0);
            const totalWithdraws = userTransactions
                .filter(t => t.type === 'withdraw' && t.status === 'approved')
                .reduce((sum, t) => sum + t.amount, 0);
                
            return {
                ...user,
                totalDeposits,
                totalWithdraws,
                transactionCount: userTransactions.length
            };
        });
    }

    // Экспорт всех данных
    exportData() {
        return {
            users: this.users,
            transactions: this.transactions,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    // Импорт данных
    importData(data) {
        if (data.users) {
            this.users = data.users;
            this.saveUsers();
        }
        if (data.transactions) {
            this.transactions = data.transactions;
            this.saveTransactions();
        }
        console.log('Data imported successfully');
    }

    // Очистка всех данных (только для разработки)
    clearAllData() {
        this.users = [];
        this.transactions = [];
        this.currentUser = null;
        localStorage.removeItem('carygame_users');
        localStorage.removeItem('carygame_transactions');
        localStorage.removeItem('carygame_currentUser');
        console.log('All data cleared');
    }
}

// Создаем глобальный экземпляр базы данных
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
    } else {
        console.log('No current user to update');
    }
}

// Функция выхода
function logout() {
    db.logoutUser();
    window.location.href = 'login.html';
}

// Функция проверки авторизации
function checkAuth() {
    if (!db.currentUser) {
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('register.html') &&
            !window.location.pathname.includes('admin.html')) {
            window.location.href = 'login.html';
            return false;
        }
    }
    return true;
}

// Функция для отладки - показывает все данные
function debugDatabase() {
    console.group('📊 Database Debug Info');
    console.log('Users:', db.users);
    console.log('Transactions:', db.transactions);
    console.log('Current User:', db.currentUser);
    console.log('System Stats:', db.getSystemStats());
    console.groupEnd();
}

// Глобальная функция для обновления баланса с анимацией
function updateUserBalanceInUI(amount) {
    if (!db.currentUser) return null;
    
    console.log(`Updating balance in UI: ${amount} ₽`);
    const newBalance = db.updateUserBalance(db.currentUser.id, amount);
    
    if (newBalance !== null) {
        updateUserInfo();
        
        // Анимация изменения баланса
        const balanceElement = document.getElementById('balance');
        if (balanceElement) {
            balanceElement.style.color = amount > 0 ? '#00ff88' : '#ff4444';
            balanceElement.style.transform = 'scale(1.1)';
            
            setTimeout(() => {
                balanceElement.style.color = '';
                balanceElement.style.transform = 'scale(1)';
            }, 500);
        }
        
        console.log(`Balance updated to: ${newBalance} ₽`);
        return newBalance;
    }
    return null;
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 App initialized');
    
    // Для отладки - выводим информацию о базе данных
    debugDatabase();
    
    if (window.location.pathname.includes('admin.html')) {
        // Админ панель инициализируется в admin.js
        console.log('Admin panel detected');
    } else if (window.location.pathname.includes('login.html')) {
        // Логин инициализируется в auth.js
        console.log('Login page detected');
    } else if (window.location.pathname.includes('register.html')) {
        // Регистрация инициализируется в auth.js
        console.log('Register page detected');
    } else {
        // Главная страница
        console.log('Main page detected');
        if (!checkAuth()) {
            return;
        }
        updateUserInfo();
    }
});

// Глобальные функции для отладки (можно удалить в продакшене)
window.debugDB = debugDatabase;
window.clearDB = () => db.clearAllData();
window.exportDB = () => {
    const data = db.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carygame-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};
