// Симуляция базы данных через LocalStorage
class Database {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('carygame_users')) || [];
        this.transactions = JSON.parse(localStorage.getItem('carygame_transactions')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('carygame_currentUser')) || null;
    }

    saveUsers() {
        localStorage.setItem('carygame_users', JSON.stringify(this.users));
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
            password: btoa(password), // Простое кодирование
            balance: 1000, // Стартовый баланс
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
        return transaction;
    }

    updateTransactionStatus(transactionId, status) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (transaction) {
            transaction.status = status;
            if (status === 'approved' && transaction.type === 'deposit') {
                const user = this.users.find(u => u.id === transaction.userId);
                if (user) {
                    user.balance += transaction.amount;
                }
            }
            this.saveTransactions();
            this.saveUsers();
        }
    }

    getUserTransactions(userId) {
        return this.transactions.filter(t => t.userId === userId);
    }

    updateUserBalance(userId, amount) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.balance += amount;
            this.saveUsers();
            return user.balance;
        }
        return null;
    }
}

const db = new Database();

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin.html')) {
        initializeAdmin();
    } else if (window.location.pathname.includes('login.html')) {
        initializeLogin();
    } else if (window.location.pathname.includes('register.html')) {
        initializeRegister();
    } else {
        initializeMain();
    }
});

function initializeMain() {
    if (!db.currentUser) {
        window.location.href = 'login.html';
        return;
    }

    updateUserInfo();
    setupNavigation();
    setupGames();
    loadTransactionHistory();
}

function updateUserInfo() {
    document.getElementById('username').textContent = db.currentUser.username;
    document.getElementById('balance').textContent = db.currentUser.balance + ' ₽';
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const gameSections = document.querySelectorAll('.game-section');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const game = this.getAttribute('data-game');
            
            // Обновляем активные кнопки
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Показываем соответствующую секцию
            gameSections.forEach(section => section.classList.remove('active'));
            document.getElementById(`${game}-game`).classList.add('active');
        });
    });
}

function logout() {
    db.logoutUser();
    window.location.href = 'login.html';
}

function loadTransactionHistory() {
    const userTransactions = db.getUserTransactions(db.currentUser.id);
    
    const depositList = document.getElementById('deposit-list');
    const withdrawList = document.getElementById('withdraw-list');
    
    depositList.innerHTML = '';
    withdrawList.innerHTML = '';
    
    userTransactions.filter(t => t.type === 'deposit').forEach(transaction => {
        const item = document.createElement('div');
        item.className = 'deposit-item';
        item.innerHTML = `
            <div>Сумма: ${transaction.amount} ₽</div>
            <div>Статус: ${getStatusText(transaction.status)}</div>
            <div>Дата: ${new Date(transaction.createdAt).toLocaleDateString()}</div>
        `;
        depositList.appendChild(item);
    });
    
    userTransactions.filter(t => t.type === 'withdraw').forEach(transaction => {
        const item = document.createElement('div');
        item.className = 'withdraw-item';
        item.innerHTML = `
            <div>Сумма: ${transaction.amount} ₽</div>
            <div>Метод: ${transaction.method}</div>
            <div>Статус: ${getStatusText(transaction.status)}</div>
            <div>Дата: ${new Date(transaction.createdAt).toLocaleDateString()}</div>
        `;
        withdrawList.appendChild(item);
    });
}

function getStatusText(status) {
    const statusMap = {
        'pending': '⏳ Ожидание',
        'approved': '✅ Одобрено',
        'rejected': '❌ Отклонено'
    };
    return statusMap[status] || status;
}
