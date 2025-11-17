function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('Заполните все поля');
        return;
    }
    
    const user = db.loginUser(username, password);
    
    if (user) {
        window.location.href = 'index.html';
    } else {
        alert('Неверное имя пользователя или пароль');
    }
}

function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!username || !password) {
        alert('Заполните все поля');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Пароли не совпадают');
        return;
    }
    
    if (db.users.find(u => u.username === username)) {
        alert('Пользователь с таким именем уже существует');
        return;
    }
    
    db.registerUser(username, password);
    alert('Регистрация успешна! Теперь войдите в систему.');
    window.location.href = 'login.html';
}
