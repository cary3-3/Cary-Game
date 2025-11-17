// Обработчики для игр и транзакций
document.addEventListener('DOMContentLoaded', function() {
    initializeGames();
    setupEventListeners();
});

function initializeGames() {
    createGlassParticles();
    setupCrashGame();
    setupSlotsGame();
    setupTowerGame();
}

function setupEventListeners() {
    // Пополнение
    if (document.getElementById('submit-deposit')) {
        document.getElementById('submit-deposit').addEventListener('click', submitDeposit);
    }
    
    // Вывод
    if (document.getElementById('submit-withdraw')) {
        document.getElementById('submit-withdraw').addEventListener('click', submitWithdraw);
    }
    
    // Навигация
    setupNavigation();
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.glass-nav-btn');
    const gameSections = document.querySelectorAll('.glass-section');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const game = this.getAttribute('data-game');
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            gameSections.forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(`${game}-game`);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

// Стеклянные частицы на фоне
function createGlassParticles() {
    const container = document.createElement('div');
    container.className = 'glass-particles';
    document.body.appendChild(container);

    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'glass-particle';
        
        const size = Math.random() * 100 + 50;
        const left = Math.random() * 100;
        const animationDelay = Math.random() * 20;
        const animationDuration = 15 + Math.random() * 15;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.animationDelay = `${animationDelay}s`;
        particle.style.animationDuration = `${animationDuration}s`;
        
        container.appendChild(particle);
    }
}

// ========== ИГРА КРАШ ==========
let crashGameActive = false;
let currentMultiplier = 1.0;
let rocketElement = null;
let crashInterval = null;
let currentBetAmount = 0;

function setupCrashGame() {
    const betButton = document.getElementById('place-bet');
    rocketElement = document.getElementById('rocket-container');
    
    if (betButton) {
        betButton.addEventListener('click', function() {
            if (crashGameActive) {
                cashOut();
                return;
            }
            
            const amount = parseInt(document.getElementById('bet-amount').value);
            
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
}

function startCrashGame(betAmount) {
    crashGameActive = true;
    currentMultiplier = 1.0;
    currentBetAmount = betAmount;
    
    const betButton = document.getElementById('place-bet');
    const multiplierDisplay = document.getElementById('current-multiplier');
    
    betButton.textContent = '💰 Забрать';
    betButton.disabled = false;
    
    // Сбрасываем позицию ракеты
    rocketElement.style.bottom = '40px';
    
    // Вычитаем ставку из баланса
    db.updateUserBalance(db.currentUser.id, -betAmount);
    updateUserInfo();
    
    // Запускаем анимацию ракеты
    crashInterval = setInterval(() => {
        if (!crashGameActive) return;
        
        // Увеличиваем множитель
        currentMultiplier += 0.02;
        multiplierDisplay.textContent = currentMultiplier.toFixed(2) + 'x';
        
        // Поднимаем ракету
        const currentBottom = parseInt(rocketElement.style.bottom) || 40;
        const newBottom = Math.max(10, currentBottom - 2);
        rocketElement.style.bottom = newBottom + 'px';
        
        // Меняем цвет в зависимости от множителя
        if (currentMultiplier > 2) {
            multiplierDisplay.style.color = 'var(--accent-orange)';
        }
        if (currentMultiplier > 3) {
            multiplierDisplay.style.color = 'var(--accent-pink)';
        }
        if (currentMultiplier > 5) {
            multiplierDisplay.style.color = '#ff4444';
        }
        
        // Случайный краш
        const crashChance = Math.min(0.4, currentMultiplier * 0.015);
        if (Math.random() < crashChance) {
            endCrashGame(false);
        }
        
        // Автоматический краш на высоких значениях
        if (currentMultiplier > 8) {
            endCrashGame(false);
        }
    }, 100);
}

function cashOut() {
    if (crashGameActive && currentMultiplier > 1.0) {
        endCrashGame(true);
    }
}

function endCrashGame(isWin) {
    clearInterval(crashInterval);
    crashGameActive = false;
    
    const betButton = document.getElementById('place-bet');
    const multiplierDisplay = document.getElementById('current-multiplier');
    
    betButton.textContent = 'Сделать ставку';
    betButton.disabled = false;
    
    if (isWin) {
        const winAmount = Math.floor(currentBetAmount * currentMultiplier);
        db.updateUserBalance(db.currentUser.id, winAmount);
        
        // Добавляем в историю
        addToCrashHistory(currentMultiplier.toFixed(2) + 'x', true);
        
        // Эффект выигрыша
        multiplierDisplay.style.color = 'var(--accent-green)';
        multiplierDisplay.style.textShadow = '0 0 30px var(--accent-green)';
        
        setTimeout(() => {
            alert(`🎉 Поздравляем! Вы успели забрать ${winAmount} ₽ (${currentMultiplier.toFixed(2)}x)`);
        }, 500);
    } else {
        // Эффект проигрыша
        rocketElement.style.animation = 'glassShake 0.5s ease-in-out';
        multiplierDisplay.style.color = '#ff4444';
        
        addToCrashHistory(currentMultiplier.toFixed(2) + 'x', false);
        
        setTimeout(() => {
            alert(`💥 Краш! Вы проиграли ставку на множителе ${currentMultiplier.toFixed(2)}x`);
            rocketElement.style.animation = '';
        }, 500);
    }
    
    updateUserInfo();
    
    // Сброс через 3 секунды
    setTimeout(() => {
        multiplierDisplay.textContent = '1.00x';
        multiplierDisplay.style.color = 'var(--text-primary)';
        multiplierDisplay.style.textShadow = '0 0 30px var(--accent-blue)';
        rocketElement.style.bottom = '40px';
    }, 3000);
}

function addToCrashHistory(multiplier, isWin) {
    const historyContainer = document.querySelector('.glass-history');
    const historyItem = document.createElement('div');
    historyItem.className = `glass-history-item ${isWin ? 'win' : ''}`;
    historyItem.textContent = multiplier;
    
    historyContainer.insertBefore(historyItem, historyContainer.firstChild);
    
    // Ограничиваем историю 8 элементами
    if (historyContainer.children.length > 8) {
        historyContainer.removeChild(historyContainer.lastChild);
    }
}

// ========== ИГРА СЛОТЫ ==========
function setupSlotsGame() {
    const spinButton = document.getElementById('spin-btn');
    
    if (spinButton) {
        spinButton.addEventListener('click', function() {
            const betAmount = parseInt(document.getElementById('slots-bet').value);
            
            if (!betAmount || betAmount < 10) {
                alert('Минимальная ставка 10 ₽');
                return;
            }
            
            if (db.currentUser.balance < betAmount) {
                alert('Недостаточно средств');
                return;
            }
            
            spinSlots(betAmount);
        });
    }
}

function spinSlots(betAmount) {
    const reels = [
        document.getElementById('reel1'),
        document.getElementById('reel2'),
        document.getElementById('reel3'),
        document.getElementById('reel4'),
        document.getElementById('reel5')
    ];
    
    const spinButton = document.getElementById('spin-btn');
    const resultDisplay = document.getElementById('slots-result');
    
    spinButton.disabled = true;
    spinButton.innerHTML = '<div class="glass-loader"></div>';
    
    // Вычитаем ставку
    db.updateUserBalance(db.currentUser.id, -betAmount);
    
    // Анимация вращения
    reels.forEach(reel => {
        reel.classList.add('spinning');
    });
    
    // Результат через 2 секунды
    setTimeout(() => {
        const symbols = ['🍒', '🍋', '🍊', '⭐', '7️⃣', '💎', '🔔'];
        const results = [];
        
        reels.forEach((reel, index) => {
            reel.classList.remove('spinning');
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            reel.textContent = randomSymbol;
            results[index] = randomSymbol;
        });
        
        // Проверка выигрыша
        const winAmount = calculateSlotsWin(results, betAmount);
        
        if (winAmount > 0) {
            db.updateUserBalance(db.currentUser.id, winAmount);
            resultDisplay.textContent = `🎉 Вы выиграли ${winAmount} ₽!`;
            resultDisplay.style.color = 'var(--accent-green)';
        } else {
            resultDisplay.textContent = '😢 Попробуйте еще раз!';
            resultDisplay.style.color = '#ff4444';
        }
        
        updateUserInfo();
        spinButton.disabled = false;
        spinButton.innerHTML = '🎯 Крутить';
        
    }, 2000);
}

function calculateSlotsWin(results, betAmount) {
    // Простая логика выигрыша
    const uniqueResults = [...new Set(results)];
    
    if (uniqueResults.length === 1) {
        // Все символы одинаковые
        return betAmount * 10;
    } else if (uniqueResults.length === 2) {
        // 4 одинаковых символа
        return betAmount * 5;
    } else if (uniqueResults.length <= 3) {
        // 3 одинаковых символа
        return betAmount * 2;
    }
    
    return 0;
}

// ========== ИГРА БАШНЯ ==========
let towerCurrentFloor = 1;
let towerBetAmount = 0;
let towerGameActive = false;

function setupTowerGame() {
    const climbButton = document.getElementById('climb-btn');
    const takeButton = document.getElementById('take-btn');
    
    if (climbButton) {
        climbButton.addEventListener('click', climbTower);
    }
    
    if (takeButton) {
        takeButton.addEventListener('click', takeTowerWin);
    }
}

function climbTower() {
    if (towerGameActive) {
        const success = Math.random() > 0.3; // 70% шанс успеха
        
        if (success) {
            towerCurrentFloor++;
            updateTowerFloors();
            
            if (towerCurrentFloor >= 10) {
                endTowerGame(true);
            }
        } else {
            endTowerGame(false);
        }
    } else {
        // Начало игры
        const betAmount = parseInt(document.getElementById('tower-bet').value);
        
        if (!betAmount || betAmount < 10) {
            alert('Минимальная ставка 10 ₽');
            return;
        }
        
        if (db.currentUser.balance < betAmount) {
            alert('Недостаточно средств');
            return;
        }
        
        towerBetAmount = betAmount;
        towerGameActive = true;
        towerCurrentFloor = 1;
        
        db.updateUserBalance(db.currentUser.id, -betAmount);
        updateUserInfo();
        
        document.getElementById('tower-result').textContent = 'Игра началась! Поднимайтесь выше!';
    }
}

function takeTowerWin() {
    if (towerGameActive && towerCurrentFloor > 1) {
        endTowerGame(true);
    }
}

function endTowerGame(isWin) {
    towerGameActive = false;
    
    const multiplier = towerCurrentFloor;
    const resultDisplay = document.getElementById('tower-result');
    
    if (isWin) {
        const winAmount = towerBetAmount * multiplier;
        db.updateUserBalance(db.currentUser.id, winAmount);
        resultDisplay.textContent = `🎉 Вы выиграли ${winAmount} ₽ (${multiplier}x)!`;
        resultDisplay.style.color = 'var(--accent-green)';
    } else {
        resultDisplay.textContent = '💥 Башня рухнула! Попробуйте еще раз.';
        resultDisplay.style.color = '#ff4444';
    }
    
    updateUserInfo();
    resetTower();
}

function updateTowerFloors() {
    const floors = document.querySelectorAll('.glass-floor');
    
    floors.forEach(floor => {
        const floorNumber = parseInt(floor.getAttribute('data-floor'));
        floor.classList.remove('active', 'reached', 'failed');
        
        if (floorNumber === towerCurrentFloor) {
            floor.classList.add('active');
        } else if (floorNumber < towerCurrentFloor) {
            floor.classList.add('reached');
        }
    });
    
    document.getElementById('tower-result').textContent = `Текущий этаж: ${towerCurrentFloor} (${towerCurrentFloor}x)`;
}

function resetTower() {
    const floors = document.querySelectorAll('.glass-floor');
    
    floors.forEach(floor => {
        floor.classList.remove('active', 'reached', 'failed');
    });
    
    // Активируем только первый этаж
    document.querySelector('.glass-floor[data-floor="1"]').classList.add('active');
}

// ========== ТРАНЗАКЦИИ ==========
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

function updateUserInfo() {
    if (db.currentUser && document.getElementById('username') && document.getElementById('balance')) {
        document.getElementById('username').textContent = db.currentUser.username;
        document.getElementById('balance').textContent = db.currentUser.balance + ' ₽';
    }
}

function loadTransactionHistory() {
    if (!db.currentUser) return;
    
    const userTransactions = db.getUserTransactions(db.currentUser.id);
    
    const depositList = document.getElementById('deposit-list');
    const withdrawList = document.getElementById('withdraw-list');
    
    if (depositList) {
        depositList.innerHTML = '';
        userTransactions.filter(t => t.type === 'deposit').forEach(transaction => {
            const item = document.createElement('div');
            item.className = 'glass-transaction-item';
            item.innerHTML = `
                <div style="display: flex; justify-content: between; align-items: center;">
                    <div>
                        <strong>${transaction.amount} ₽</strong>
                        <div style="color: var(--text-secondary); font-size: 0.9em; margin-top: 5px;">
                            Статус: ${getStatusText(transaction.status)}
                        </div>
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.9em;">
                        ${new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                </div>
            `;
            depositList.appendChild(item);
        });
    }
    
    if (withdrawList) {
        withdrawList.innerHTML = '';
        userTransactions.filter(t => t.type === 'withdraw').forEach(transaction => {
            const item = document.createElement('div');
            item.className = 'glass-transaction-item';
            item.innerHTML = `
                <div style="display: flex; justify-content: between; align-items: center;">
                    <div>
                        <strong>${transaction.amount} ₽</strong>
                        <div style="color: var(--text-secondary); font-size: 0.9em; margin-top: 5px;">
                            ${transaction.method} • Статус: ${getStatusText(transaction.status)}
                        </div>
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.9em;">
                        ${new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                </div>
            `;
            withdrawList.appendChild(item);
        });
    }
}

function getStatusText(status) {
    const statusMap = {
        'pending': '⏳ Ожидание',
        'approved': '✅ Одобрено',
        'rejected': '❌ Отклонено'
    };
    return statusMap[status] || status;
}
