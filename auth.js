async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('Заполните все поля');
        return;
    }
    
    try {
        const user = await db.loginUser(username, password);
        alert('✅ Вход успешен!');
        window.location.href = 'index.html';
    } catch (error) {
        alert('❌ Неверное имя пользователя или пароль');
    }
}

async function register() {
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
        await db.registerUser(username, password);
        alert('✅ Регистрация успешна! Теперь войдите в систему.');
        window.location.href = 'login.html';
    } catch (error) {
        alert('❌ Ошибка регистрации: ' + error.message);
    }
}
