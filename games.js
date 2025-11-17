// Обработчики для игр и транзакций
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('submit-deposit')) {
        document.getElementById('submit-deposit').addEventListener('click', submitDeposit);
    }
    
    if (document.getElementById('submit-withdraw')) {
        document.getElementById('submit-withdraw').addEventListener('click', submitWithdraw);
    }
    
    if (document.getElementById('place-bet')) {
        setupCrashGame();
    }
});

let crashGameActive = false;
let currentMultiplier = 1.0;
let rocketElement = null;
let crashInterval = null;

function setupCrashGame() {
    const betButton = document.getElementById('place-bet');
    const betAmountInput = document.getElementById('bet-amount');
    
    // Создаем элемент ракеты
    createRocket();
    
    betButton.addEventListener('click', function() {
        if (crashGameActive) {
            cashOut();
            return;
        }
        
        const amount = parseInt(betAmountInput.value);
        
        if (!amount || amount < 10) {
            alert('Минимальная ставка 10 ₽');
            return;
        }
        
        if (db.currentUser.balance < amount) {
            alert('Недостаточно средств');
            return;
        }
        
        startCrashGame(amount);
    });
}

function createRocket() {
    const crashGraph = document.querySelector('.crash-graph');
    rocketElement = document.createElement('div');
    rocketElement.className = 'rocket';
    crashGraph.appendChild(rocketElement);
    
    // Добавляем центральную линию
    const line = document.createElement('div');
    line.className = 'crash-line';
    crashGraph.appendChild(line);
}

function startCrashGame(betAmount) {
    crashGameActive = true;
    currentMultiplier = 1.0;
    const betButton = document.getElementById('place-bet');
    const multiplierDisplay = document.getElementById('current-multiplier');
    
    // Блокируем кнопку ставки
    betButton.textContent = 'Забрать';
    betButton.disabled = false;
    
    // Сбрасываем позицию ракеты
    rocketElement.style.bottom = '20px';
    
    // Вычитаем ставку из баланса
    db.updateUserBalance(db.currentUser.id, -betAmount);
    updateUserInfo();
    
    // Запускаем анимацию ракеты
    crashInterval = setInterval(() => {
        if (!crashGameActive) return;
        
        // Увеличиваем множитель
        currentMultiplier += 0.01;
        multiplierDisplay.textContent = currentMultiplier.toFixed(2) + 'x';
        
        // Поднимаем ракету
        const currentBottom = parseInt(rocketElement.style.bottom) || 20;
        const newBottom = Math.max(5, currentBottom - 1);
        rocketElement.style.bottom = newBottom + 'px';
        
        // Меняем цвет множителя в зависимости от значения
        if (currentMultiplier > 2) {
            multiplierDisplay.style.color = '#ffaa00';
        }
        if (currentMultiplier > 3) {
            multiplierDisplay.style.color = '#ff4444';
        }
        
        // Случайный краш (чем выше множитель, тем больше шанс краша)
        const crashChance = Math.min(0.3, currentMultiplier * 0.01);
        if (Math.random() < crashChance) {
            endCrashGame(false, betAmount);
        }
        
        // Автоматический краш на высоких значениях
        if (currentMultiplier > 10) {
            endCrashGame(false, betAmount);
        }
    }, 100);
}

function cashOut() {
    if (crashGameActive && currentMultiplier > 1.0) {
        endCrashGame(true);
    }
}

function endCrashGame(isWin, betAmount = 0) {
    clearInterval(crashInterval);
    crashGameActive = false;
    
    const betButton = document.getElementById('place-bet');
    const multiplierDisplay = document.getElementById('current-multiplier');
    
    betButton.textContent = 'Сделать ставку';
    betButton.disabled = false;
    
    if (isWin) {
        const winAmount = Math.floor(betAmount * currentMultiplier);
        db.updateUserBalance(db.currentUser.id, winAmount);
        
        // Добавляем в историю
        addToHistory(currentMultiplier.toFixed(2) + 'x', true);
        
        // Взрыв ракеты при выигрыше
        rocketElement.style.background = 'linear-gradient(45deg, #00ff00, #00aa00)';
        multiplierDisplay.style.color = '#00ff00';
        multiplierDisplay.style.textShadow = '0 0 20px #00ff00';
        
        alert(`🎉 Поздравляем! Вы успели забрать ${winAmount} ₽ (${currentMultiplier.toFixed(2)}x)`);
    } else {
        // Взрыв ракеты при проигрыше
        rocketElement.style.background = 'linear-gradient(45deg, #ff4444, #aa0000)';
        rocketElement.style.animation = 'shake 0.5s ease-in-out';
        
        addToHistory(currentMultiplier.toFixed(2) + 'x', false);
        alert(`💥 Краш! Вы проиграли ставку на множителе ${currentMultiplier.toFixed(2)}x`);
    }
    
    updateUserInfo();
    
    // Сброс через 3 секунды
    setTimeout(() => {
        multiplierDisplay.textContent = '1.00x';
        multiplierDisplay.style.color = '#00ff00';
        multiplierDisplay.style.textShadow = '0 0 10px #00ff00';
        rocketElement.style.background = 'linear-gradient(45deg, #ff4444, #ffaa00)';
        rocketElement.style.bottom = '20px';
        rocketElement.style.animation = '';
    }, 3000);
}

function addToHistory(multiplier, isWin) {
    const historyContainer = document.querySelector('.crash-history');
    const historyItem = document.createElement('div');
    historyItem.className = `history-item ${isWin ? 'win' : ''}`;
    historyItem.textContent = multiplier;
    
    historyContainer.insertBefore(historyItem, historyContainer.firstChild);
    
    // Ограничиваем историю 10 элементами
    if (historyContainer.children.length > 10) {
        historyContainer.removeChild(historyContainer.lastChild);
    }
}

function submitDeposit() {
    const amount = document.getElementById('deposit-amount').value;
    
    if (!amount || amount < 100) {
        alert('Минимальная сумма пополнения 100 ₽');
        return;
    }
    
    db.createDeposit(db.currentUser.id, amount);
    alert('Заявка на пополнение отправлена! Ожидайте подтверждения администратора.');
    document.getElementById('deposit-amount').value = '';
    loadTransactionHistory();
}

function submitWithdraw() {
    const amount = document.getElementById('withdraw-amount').value;
    const method = document.getElementById('withdraw-method').value;
    
    if (!amount || amount < 500) {
        alert('Минимальная сумма вывода 500 ₽');
        return;
    }
    
    if (!method) {
        alert('Укажите реквизиты для вывода');
        return;
    }
    
    if (db.currentUser.balance < amount) {
        alert('Недостаточно средств на балансе');
        return;
    }
    
    db.createWithdraw(db.currentUser.id, amount, method);
    alert('Заявка на вывод отправлена! Ожидайте подтверждения администратора.');
    document.getElementById('withdraw-amount').value = '';
    document.getElementById('withdraw-method').value = '';
    loadTransactionHistory();
        }
