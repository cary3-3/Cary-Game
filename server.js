const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Единая база данных в памяти
let users = [
    {
        id: '1',
        username: 'admin',
        password: 'YWRtaW4=', // admin в base64
        balance: 0,
        role: 'admin',
        createdAt: new Date().toISOString()
    }
];
let transactions = [];

// Middleware для проверки авторизации
function authMiddleware(req, res, next) {
    const userId = req.headers['user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'Не авторизован' });
    }
    next();
}

// Регистрация
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    
    const user = {
        id: Date.now().toString(),
        username,
        password: Buffer.from(password).toString('base64'),
        balance: 5000,
        role: 'user',
        createdAt: new Date().toISOString()
    };
    
    users.push(user);
    res.json({ user: { id: user.id, username: user.username, balance: user.balance } });
});

// Вход
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const passwordHash = Buffer.from(password).toString('base64');
    const user = users.find(u => u.username === username && u.password === passwordHash);
    
    if (user) {
        res.json({ 
            user: { 
                id: user.id, 
                username: user.username, 
                balance: user.balance,
                role: user.role 
            } 
        });
    } else {
        res.status(401).json({ error: 'Неверные данные' });
    }
});

// Получить баланс
app.get('/api/balance', authMiddleware, (req, res) => {
    const userId = req.headers['user-id'];
    const user = users.find(u => u.id === userId);
    res.json({ balance: user.balance });
});

// Обновить баланс
app.post('/api/balance', authMiddleware, (req, res) => {
    const userId = req.headers['user-id'];
    const { amount } = req.body;
    const user = users.find(u => u.id === userId);
    
    user.balance += amount;
    user.balance = Math.max(0, user.balance);
    
    res.json({ balance: user.balance });
});

// Создать заявку на пополнение
app.post('/api/deposit', authMiddleware, (req, res) => {
    const userId = req.headers['user-id'];
    const { amount } = req.body;
    
    const transaction = {
        id: Date.now().toString(),
        userId,
        type: 'deposit',
        amount: parseInt(amount),
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    transactions.push(transaction);
    res.json({ transaction });
});

// Создать заявку на вывод
app.post('/api/withdraw', authMiddleware, (req, res) => {
    const userId = req.headers['user-id'];
    const { amount, method } = req.body;
    const user = users.find(u => u.id === userId);
    
    if (user.balance < amount) {
        return res.status(400).json({ error: 'Недостаточно средств' });
    }
    
    user.balance -= amount;
    
    const transaction = {
        id: Date.now().toString(),
        userId,
        type: 'withdraw',
        amount: parseInt(amount),
        method,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    transactions.push(transaction);
    res.json({ transaction, balance: user.balance });
});

// Админ: получить всех пользователей
app.get('/api/admin/users', (req, res) => {
    // Проверка админских прав (в реальном приложении нужна настоящая аутентификация)
    const usersWithoutPasswords = users.map(user => ({
        id: user.id,
        username: user.username,
        balance: user.balance,
        role: user.role,
        createdAt: user.createdAt
    }));
    res.json({ users: usersWithoutPasswords });
});

// Админ: получить все транзакции
app.get('/api/admin/transactions', (req, res) => {
    const transactionsWithUsers = transactions.map(transaction => {
        const user = users.find(u => u.id === transaction.userId);
        return {
            ...transaction,
            username: user ? user.username : 'Неизвестный'
        };
    });
    res.json({ transactions: transactionsWithUsers });
});

// Админ: обновить статус транзакции
app.post('/api/admin/transactions/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const transaction = transactions.find(t => t.id === id);
    
    if (transaction) {
        transaction.status = status;
        
        if (status === 'approved' && transaction.type === 'deposit') {
            const user = users.find(u => u.id === transaction.userId);
            if (user) {
                user.balance += transaction.amount;
            }
        }
        
        res.json({ transaction });
    } else {
        res.status(404).json({ error: 'Транзакция не найдена' });
    }
});

// Админ: изменить баланс пользователя
app.post('/api/admin/users/:id/balance', (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;
    const user = users.find(u => u.id === id);
    
    if (user) {
        user.balance += amount;
        res.json({ user: { id: user.id, username: user.username, balance: user.balance } });
    } else {
        res.status(404).json({ error: 'Пользователь не найден' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${port}`);
});
