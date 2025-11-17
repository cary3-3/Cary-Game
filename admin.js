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
    loadDepositRequests();
    loadWithdrawRequests();
    loadUsersList();
}

function loadDepositRequests() {
    const container = document.getElementById('deposit-requests');
    const pendingDeposits = db.transactions.filter(t => t.type === 'deposit' && t.status === 'pending');
    
    container.innerHTML = '';
    
    if (pendingDeposits.length === 0) {
        container.innerHTML = '<div class="request-item">Нет заявок на пополнение</div>';
        return;
    }
    
    pendingDeposits.forEach(transaction => {
        const user = db.users.find(u => u.id === transaction.userId);
        const item = document.createElement('div');
        item.className = 'request-item';
        item.innerHTML = `
            <div>
                <strong>${user ? user.username : 'Неизвестный'}</strong><br>
                Сумма: ${transaction.amount} ₽<br>
                Дата: ${new Date(transaction.createdAt).toLocaleString()}
            </div>
            <div>
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
    
    container.innerHTML = '';
    
    if (pendingWithdraws.length === 0) {
        container.innerHTML = '<div class="request-item">Нет заявок на вывод</div>';
        return;
    }
    
    pendingWithdraws.forEach(transaction => {
        const user = db.users.find(u => u.id === transaction.userId);
        const item = document.createElement('div');
        item.className = 'request-item';
        item.innerHTML = `
            <div>
                <strong>${user ? user.username : 'Неизвестный'}</strong><br>
                Сумма: ${transaction.amount} ₽<br>
                Метод: ${transaction.method}<br>
                Дата: ${new Date(transaction.createdAt).toLocaleString()}
            </div>
            <div>
                <button class="approve-btn" onclick="approveTransaction('${transaction.id}')">✅ Одобрить</button>
                <button class="reject-btn" onclick="rejectTransaction('${transaction.id}')">❌ Отклонить</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function loadUsersList() {
    const container = document.getElementById('users-list');
    
    container.innerHTML = '';
    
    if (db.users.length === 0) {
        container.innerHTML = '<div class="request-item">Нет пользователей</div>';
        return;
    }
    
    db.users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'request-item';
        item.innerHTML = `
            <div>
                <strong>${user.username}</strong><br>
                Баланс: ${user.balance} ₽<br>
                Регистрация: ${new Date(user.createdAt).toLocaleDateString()}
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

function adminLogout() {
    window.location.href = 'login.html';
}

// Инициализация админ панели
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin.html')) {
        const adminLoginBtn = document.querySelector('.login-btn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', adminLogin);
        }
        
        // Enter для входа в админку
        const adminInput = document.getElementById('admin-password');
        if (adminInput) {
            adminInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    adminLogin();
                }
            });
        }
    }
});
