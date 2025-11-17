const ADMIN_PASSWORD = 'tyupi333';

function adminLogin() {
    const password = document.getElementById('admin-password').value;
    
    if (password === ADMIN_PASSWORD) {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        loadAdminData();
    } else {
        alert('Неверный пароль администратора');
    }
}

function loadAdminData() {
    console.log('Loading admin data...');
    console.log('Total users:', db.users.length);
    console.log('Total transactions:', db.transactions.length);
    
    loadDepositRequests();
    loadWithdrawRequests();
    loadUsersList();
}

function loadDepositRequests() {
    const container = document.getElementById('deposit-requests');
    const pendingDeposits = db.transactions.filter(t => t.type === 'deposit' && t.status === 'pending');
    
    console.log('Pending deposits:', pendingDeposits);
    
    container.innerHTML = '';
    
    if (pendingDeposits.length === 0) {
        container.innerHTML = '<div class="request-item">Нет заявок на пополнение</div>';
        return;
    }
    
    pendingDeposits.forEach(transaction => {
        const user = db.users.find(u => u.id === transaction.userId);
        console.log('Found user for deposit:', user);
        
        const item = document.createElement('div');
        item.className = 'request-item';
        item.innerHTML = `
            <div>
                <strong>${user ? user.username : 'Неизвестный пользователь'}</strong><br>
                ID: ${transaction.userId}<br>
                Сумма: ${transaction.amount} ₽<br>
                Дата: ${new Date(transaction.createdAt).toLocaleString()}
            </div>
            <div class="admin-actions">
                <button class="approve-btn" onclick="approveTransaction('${transaction.id}')">✅ Одобрить</button>
                <button class="reject-btn" onclick="rejectTransaction('${transaction.id}')">❌ Отклонить</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function loadWithdrawRequests() {
    const container = document.getElementById('withdraw-requests');
    const pendingWithdraws = db.transactions.filter(t => t.type === 'withdraw' && t.status === 'pending');
    
    console.log('Pending withdraws:', pendingWithdraws);
    
    container.innerHTML = '';
    
    if (pendingWithdraws.length === 0) {
        container.innerHTML = '<div class="request-item">Нет заявок на вывод</div>';
        return;
    }
    
    pendingWithdraws.forEach(transaction => {
        const user = db.users.find(u => u.id === transaction.userId);
        console.log('Found user for withdraw:', user);
        
        const item = document.createElement('div');
        item.className = 'request-item';
        item.innerHTML = `
            <div>
                <strong>${user ? user.username : 'Неизвестный пользователь'}</strong><br>
                ID: ${transaction.userId}<br>
                Сумма: ${transaction.amount} ₽<br>
                Метод: ${transaction.method}<br>
                Дата: ${new Date(transaction.createdAt).toLocaleString()}
            </div>
            <div class="admin-actions">
                <button class="approve-btn" onclick="approveTransaction('${transaction.id}')">✅ Одобрить</button>
                <button class="reject-btn" onclick="rejectTransaction('${transaction.id}')">❌ Отклонить</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function loadUsersList() {
    const container = document.getElementById('users-list');
    
    console.log('All users:', db.users);
    
    container.innerHTML = '';
    
    if (db.users.length === 0) {
        container.innerHTML = '<div class="request-item">Нет пользователей</div>';
        return;
    }
    
    db.users.forEach(user => {
        const userTransactions = db.transactions.filter(t => t.userId === user.id);
        const totalDeposits = userTransactions.filter(t => t.type === 'deposit' && t.status === 'approved').reduce((sum, t) => sum + t.amount, 0);
        const totalWithdraws = userTransactions.filter(t => t.type === 'withdraw' && t.status === 'approved').reduce((sum, t) => sum + t.amount, 0);
        
        const item = document.createElement('div');
        item.className = 'request-item';
        item.innerHTML = `
            <div style="flex: 1;">
                <strong>${user.username}</strong><br>
                ID: ${user.id}<br>
                Баланс: ${user.balance} ₽<br>
                Пополнено: ${totalDeposits} ₽ | Выведено: ${totalWithdraws} ₽<br>
                Регистрация: ${new Date(user.createdAt).toLocaleDateString()}
            </div>
            <div class="admin-actions">
                <button class="approve-btn" onclick="addBalanceToUser('${user.id}', 1000)">+1000 ₽</button>
                <button class="approve-btn" onclick="addBalanceToUser('${user.id}', 5000)">+5000 ₽</button>
                <button class="reject-btn" onclick="resetUserBalance('${user.id}')">Обнулить</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function approveTransaction(transactionId) {
    db.updateTransactionStatus(transactionId, 'approved');
    loadAdminData();
    alert('Транзакция одобрена');
}

function rejectTransaction(transactionId) {
    db.updateTransactionStatus(transactionId, 'rejected');
    loadAdminData();
    alert('Транзакция отклонена');
}

function addBalanceToUser(userId, amount) {
    const user = db.users.find(u => u.id === userId);
    if (user) {
        db.updateUserBalance(userId, amount);
        loadAdminData();
        alert(`Баланс пользователя ${user.username} пополнен на ${amount} ₽`);
    }
}

function resetUserBalance(userId) {
    const user = db.users.find(u => u.id === userId);
    if (user) {
        const currentBalance = user.balance;
        db.updateUserBalance(userId, -currentBalance);
        loadAdminData();
        alert(`Баланс пользователя ${user.username} обнулен`);
    }
}

function adminLogout() {
    window.location.href = 'login.html';
}

// Инициализация админ панели
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel initialized');
    
    // Показываем статистику базы данных
    console.log('Database stats:', {
        users: db.users.length,
        transactions: db.transactions.length,
        currentUser: db.currentUser
    });
    
    const adminLoginBtn = document.querySelector('.login-btn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', adminLogin);
    }
    
    const adminInput = document.getElementById('admin-password');
    if (adminInput) {
        adminInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                adminLogin();
            }
        });
    }
});
