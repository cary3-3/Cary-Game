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

// Обработчики для страниц входа и регистрации
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('login.html')) {
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', login);
        }
        
        // Enter для входа
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    login();
                }
            });
        });
    }
    
    if (window.location.pathname.includes('register.html')) {
        const registerBtn = document.querySelector('.login-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', register);
        }
        
        // Enter для регистрации
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    register();
                }
            });
        });
    }
});
