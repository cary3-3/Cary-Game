// Функция входа
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('Заполните все поля');
        return;
    }
    
    const user = db.loginUser(username, password);
    
    if (user) {
        alert('✅ Вход успешен!');
        window.location.href = 'index.html';
    } else {
        alert('❌ Неверное имя пользователя или пароль');
    }
}

// Функция регистрации
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
    
    try {
        const user = db.registerUser(username, password);
        alert('✅ Регистрация успешна! Теперь войдите в систему.');
        window.location.href = 'login.html';
    } catch (error) {
        alert('❌ ' + error.message);
    }
}

// Обработчики для страниц входа и регистрации
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth system initialized');
    
    if (window.location.pathname.includes('login.html')) {
        const loginBtn = document.querySelector('.glass-auth-btn');
        if (loginBtn) {
            console.log('Login button found');
            loginBtn.addEventListener('click', login);
        } else {
            console.log('Login button NOT found');
        }
        
        // Enter для входа
        const inputs = document.querySelectorAll('.glass-input');
        inputs.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    login();
                }
            });
        });
    }
    
    if (window.location.pathname.includes('register.html')) {
        const registerBtn = document.querySelector('.glass-auth-btn');
        if (registerBtn) {
            console.log('Register button found');
            registerBtn.addEventListener('click', register);
        }
        
        // Enter для регистрации
        const inputs = document.querySelectorAll('.glass-input');
        inputs.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    register();
                }
            });
        });
    }
});
