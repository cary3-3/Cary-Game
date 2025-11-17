const ADMIN_PASSWORD = 'tyupi333';

function adminLogin() {
    const password = document.getElementById('admin-password').value;
    
    if (!password) {
        alert('Введите пароль администратора');
        return;
    }
    
    if (password === ADMIN_PASSWORD) {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        loadAdminData();
        alert('✅ Доступ разрешен!');
    } else {
        alert('❌ Неверный пароль администратора');
    }
}

function loadAdminData() {
    console.log('Loading admin data...');
    
    // Обновляем статистику
    const stats = db.getSystemStats();
    document.getElementById('users-count').textContent = stats.totalUsers;
    document.getElementById('deposits-count').textContent = stats.totalDeposits;
    document.getElementById('withdraws-count').textContent = stats.totalWithdraws;
    document.getElementById('total-balance').textContent = stats.totalBalance;
    
    loadDepositRequests();
    loadWithdrawRequests();
    loadUsersList();
}

function loadDepositRequests() {
    const container = document.getElementById('deposit-requests');
    const pendingDeposits = db.transactions.filter(t => t.type === 'deposit' && t.status === 'pending');
    
    container.innerHTML = '';
    
    if (pendingDeposits.length === 0) {
        container.innerHTML = '<div class="glass-transaction-item">✅ Нет заявок на пополнение</div>';
        return;
    }
    
    pendingDeposits.forEach(transaction => {
        const user = db.users.find(u => u.id === transaction.userId);
        
        const item = document.createElement('div');
        item.className = 'glass-transaction-item';
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div style="flex: 1;">
                    <strong>👤 ${user ? user.username : 'Неизвестный'}</strong>
                    <div style="color: var(--text-secondary); font-size: 0.9em; margin-top: 5px;">
                        💰 Сумма: ${transaction.amount} ₽<br>
                        📅 ${new Date(transaction.createdAt).toLocaleString()}
                    </div>
                </div>
                <div class="admin-actions">
                    <button class="glass-admin-btn approve" onclick="approveTransaction('${transaction.id}')">
                        ✅ Одобрить
                    </button>
                    <button class="glass-admin-btn reject" onclick="rejectTransaction('${transaction.id}')">
                        ❌ Отклонить
                    </button>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

function loadWithdrawRequests() {
    const container = document.getElementById('withdraw-requests');
    const pendingWithdraws = db.transactions.filter(t => t.type === 'withdraw' && t.status === 'pending');
    
    container.innerHTML = '';
    
    if (pendingWithdraws.length === 0) {
        container.innerHTML = '<div class="glass-transaction-item">✅ Нет заявок на вывод</div>';
        return;
    }
    
    pendingWithdraws.forEach(transaction => {
        const user = db.users.find(u => u.id === transaction.userId);
        
        const item = document.createElement('div');
        item.className = 'glass-transaction-item';
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div style="flex: 1;">
                    <strong>👤 ${user ? user.username : 'Неизвестный'}</strong>
                    <div style="color: var(--text-secondary); font-size: 0.9em; margin-top: 5px;">
                        💰 Сумма: ${transaction.amount} ₽<br>
                        📋 Метод: ${transaction.method}<br>
                        📅 ${new Date(transaction.createdAt).toLocaleString()}
                    </div>
                </div>
                <div class="admin-actions">
                    <button class="glass-admin-btn approve" onclick="approveTransaction('${transaction.id}')">
                        ✅ Одобрить
                    </button>
                    <button class="glass-admin-btn reject" onclick="rejectTransaction('${transaction.id}')">
                        ❌ Отклонить
                    </button>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

function loadUsersList() {
    const container = document.getElementById('users-list');
    
    container.innerHTML = '';
    
    if (db.users.length === 0) {
        container.innerHTML = '<div class="glass-transaction-item">👥 Нет пользователей</div>';
        return;
    }
    
    db.users.forEach(user => {
        const userTransactions = db.transactions.filter(t => t.userId === user.id);
        const totalDeposits = userTransactions.filter(t => t.type === 'deposit' && t.status === 'approved').reduce((sum, t) => sum + t.amount, 0);
        const totalWithdraws = userTransactions.filter(t => t.type === 'withdraw' && t.status === 'approved').reduce((sum, t) => sum + t.amount, 0);
        
        const item = document.createElement('div');
        item.className = 'glass-transaction-item';
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div style="flex: 1;">
                    <strong>👤 ${user.username}</strong>
                    <div style="color: var(--text-secondary); font-size: 0.9em; margin-top: 5px;">
                        💰 Баланс: ${user.balance} ₽<br>
                        📥 Пополнено: ${totalDeposits} ₽ | 📤 Выведено: ${totalWithdraws} ₽<br>
                        📅 Регистрация: ${new Date(user.createdAt).toLocaleDateString()}
                    </div>
                </div>
                <div class="admin-actions">
                    <button class="glass-admin-btn balance" onclick="addBalanceToUser('${user.id}', 1000)">
                        +1,000 ₽
                    </button>
                    <button class="glass-admin-btn balance" onclick="addBalanceToUser('${user.id}', 5000)">
                        +5,000 ₽
                    </button>
                    <button class="glass-admin-btn reset" onclick="resetUserBalance('${user.id}')">
                        🗑️ Обнулить
                    </button>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

function approveTransaction(transactionId) {
    db.updateTransactionStatus(transactionId, 'approved');
    loadAdminData();
    alert('✅ Транзакция одобрена');
}

function rejectTransaction(transactionId) {
    db.updateTransactionStatus(transactionId, 'rejected');
    loadAdminData();
    alert('❌ Транзакция отклонена');
}

function addBalanceToUser(userId, amount) {
    const user = db.users.find(u => u.id === userId);
    if (user) {
        db.updateUserBalance(userId, amount);
        loadAdminData();
        alert(`✅ Баланс пользователя ${user.username} пополнен на ${amount} ₽`);
    }
}

function resetUserBalance(userId) {
    const user = db.users.find(u => u.id === userId);
    if (user) {
        const currentBalance = user.balance;
        db.updateUserBalance(userId, -currentBalance);
        loadAdminData();
        alert(`🗑️ Баланс пользователя ${user.username} обнулен`);
    }
}

function adminLogout() {
    window.location.href = 'login.html';
}

// Инициализация админ панели
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel initialized');
    
    const adminLoginBtn = document.getElementById('admin-login-btn');
    if (adminLoginBtn) {
        console.log('Admin login button found');
        adminLoginBtn.addEventListener('click', adminLogin);
    } else {
        console.log('Admin login button NOT found');
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
