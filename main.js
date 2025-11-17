// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let crashGameActive = false;
let currentMultiplier = 1.0;
let crashInterval = null;
let currentBetAmount = 0;

let towerCurrentFloor = 1;
let towerBetAmount = 0;
let towerGameActive = false;

// ========== ОСНОВНЫЕ ФУНКЦИИ ==========
function updateUserBalance(amount) {
    if (!db.currentUser) return;
    
    console.log(`Updating balance: ${amount} ₽`);
    const newBalance = db.updateUserBalance(db.currentUser.id, amount);
    
    if (newBalance !== null) {
        updateUserInfo();
        
        // Анимация изменения баланса
        const balanceElement = document.getElementById('balance');
        if (balanceElement) {
            balanceElement.style.color = amount > 0 ? '#00ff88' : '#ff4444';
            balanceElement.style.transform = 'scale(1.1)';
            
            setTimeout(() => {
                balanceElement.style.color = '';
                balanceElement.style.transform = 'scale(1)';
            }, 300);
        }
        
        console.log(`Balance updated to: ${newBalance} ₽`);
        return newBalance;
    }
    return null;
}

function updateUserInfo() {
    if (db.currentUser) {
        const usernameElement = document.getElementById('username');
        const balanceElement = document.getElementById('balance');
        
        if (usernameElement) usernameElement.textContent = db.currentUser.username;
        if (balanceElement) balanceElement.textContent = db.currentUser.balance + ' ₽';
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing games...');
    initializeAll();
});

function initializeAll() {
    createGlassParticles();
    setupNavigation();
    setupCrashGame();
    setupSlotsGame();
    setupTowerGame();
    setupTransactions();
    
    if (db.currentUser) {
        updateUserInfo();
        loadTransactionHistory();
    }
}

// ========== НАВИГАЦИЯ ==========
function setupNavigation() {
    const navButtons = document.querySelectorAll('.glass-nav-btn');
    const gameSections = document.querySelectorAll('.glass-section');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const game = this.getAttribute('data-game');
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            gameSections.forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(game + '-game');
            if (targetSection) targetSection.classList.add('active');
        });
    });
}

// ========== ЧАСТИЦЫ ФОНА ==========
function createGlassParticles() {
    const container = document.createElement('div');
    container.className = 'glass-particles';
    document.body.appendChild(container);

    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'glass-particle';
        
        const size = Math.random() * 80 + 40;
        const left = Math.random() * 100;
        const animationDelay = Math.random() * 15;
        const animationDuration = 12 + Math.random() * 12;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.animationDelay = `${animationDelay}s`;
        particle.style.animationDuration = `${animationDuration}s`;
        
        container.appendChild(particle);
    }
}

// ========== ИГРА КРАШ ==========
function setupCrashGame() {
    const betButton = document.getElementById('place-bet');
    if (betButton) {
        betButton.addEventListener('click', handleCrashBet);
    }
}

function handleCrashBet() {
    if (crashGameActive) {
        cashOut();
        return;
    }
    
    const amountInput = document.getElementById('bet-amount');
    const amount = parseInt(amountInput.value);
    
    if (!amount || amount < 10) {
        alert('Минимальная ставка 10 ₽');
        return;
    }
    
    if (db.currentUser.balance < amount) {
        alert('Недостаточно средств');
        return;
    }
    
    startCrashGame(amount);
}

function startCrashGame(betAmount) {
    crashGameActive = true;
    currentMultiplier = 1.0;
    currentBetAmount = betAmount;
    
    const betButton = document.getElementById('place-bet');
    const multiplierDisplay = document.getElementById('current-multiplier');
    const rocketElement = document.getElementById('rocket-container');
    
    betButton.textContent = '💰 Забрать';
    
    // Списываем ставку сразу
    updateUserBalance(-betAmount);
    
    // Сбрасываем позицию ракеты
    rocketElement.style.bottom = '40px';
    
    // Запускаем игровой цикл
    crashInterval = setInterval(() => {
        if (!crashGameActive) return;
        
        currentMultiplier += 0.03;
        multiplierDisplay.textContent = currentMultiplier.toFixed(2) + 'x';
        
        // Поднимаем ракету
        const currentBottom = parseInt(rocketElement.style.bottom) || 40;
        const newBottom = Math.max(5, currentBottom - 3);
        rocketElement.style.bottom = newBottom + 'px';
        
        // Меняем цвет
        if (currentMultiplier > 2) multiplierDisplay.style.color = '#ffaa00';
        if (currentMultiplier > 3) multiplierDisplay.style.color = '#ff4444';
        if (currentMultiplier > 5) multiplierDisplay.style.color = '#ff0066';
        
        // Случайный краш
        const crashChance = Math.min(0.5, currentMultiplier * 0.02);
        if (Math.random() < crashChance) {
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
    
    if (isWin) {
        const winAmount = Math.floor(currentBetAmount * currentMultiplier);
        updateUserBalance(winAmount);
        addToCrashHistory(currentMultiplier.toFixed(2) + 'x', true);
        multiplierDisplay.style.color = '#00ff88';
        
        setTimeout(() => {
            alert(`🎉 Вы выиграли ${winAmount} ₽ (${currentMultiplier.toFixed(2)}x)!`);
        }, 300);
    } else {
        addToCrashHistory(currentMultiplier.toFixed(2) + 'x', false);
        const rocketElement = document.getElementById('rocket-container');
        rocketElement.style.animation = 'glassShake 0.8s ease-in-out';
        
        setTimeout(() => {
            alert(`💥 Краш на ${currentMultiplier.toFixed(2)}x! Ставка проиграна.`);
            rocketElement.style.animation = '';
        }, 300);
    }
    
    // Сброс игры
    setTimeout(() => {
        multiplierDisplay.textContent = '1.00x';
        multiplierDisplay.style.color = '';
        const rocketElement = document.getElementById('rocket-container');
        rocketElement.style.bottom = '40px';
    }, 2000);
}

function addToCrashHistory(multiplier, isWin) {
    const historyContainer = document.querySelector('.glass-history');
    const historyItem = document.createElement('div');
    historyItem.className = `glass-history-item ${isWin ? 'win' : ''}`;
    historyItem.textContent = multiplier;
    historyContainer.insertBefore(historyItem, historyContainer.firstChild);
    
    if (historyContainer.children.length > 10) {
        historyContainer.removeChild(historyContainer.lastChild);
    }
}

// ========== ИГРА СЛОТЫ ==========
function setupSlotsGame() {
    const spinButton = document.getElementById('spin-btn');
    if (spinButton) {
        spinButton.addEventListener('click', handleSlotsSpin);
    }
}

function handleSlotsSpin() {
    const betInput = document.getElementById('slots-bet');
    const betAmount = parseInt(betInput.value);
    
    if (!betAmount || betAmount < 10) {
        alert('Минимальная ставка 10 ₽');
        return;
    }
    
    if (db.currentUser.balance < betAmount) {
        alert('Недостаточно средств');
        return;
    }
    
    spinSlots(betAmount);
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
    spinButton.innerHTML = '<div class="glass-loader"></div> Крутится...';
    
    // Списываем ставку сразу
    updateUserBalance(-betAmount);
    
    // Анимация вращения
    reels.forEach(reel => reel.classList.add('spinning'));
    
    setTimeout(() => {
        const symbols = ['🍒', '🍋', '🍊', '⭐', '7️⃣', '💎'];
        const results = [];
        
        reels.forEach((reel, index) => {
            reel.classList.remove('spinning');
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            reel.textContent = randomSymbol;
            results[index] = randomSymbol;
        });
        
        // Проверяем выигрыш
        const winAmount = calculateSlotsWin(results, betAmount);
        
        if (winAmount > 0) {
            updateUserBalance(winAmount);
            resultDisplay.textContent = `🎉 Выигрыш ${winAmount} ₽!`;
            resultDisplay.style.color = '#00ff88';
        } else {
            resultDisplay.textContent = 'Попробуйте еще раз!';
            resultDisplay.style.color = '#ff4444';
        }
        
        spinButton.disabled = false;
        spinButton.textContent = '🎯 Крутить';
        
    }, 2000);
}

function calculateSlotsWin(results, betAmount) {
    const counts = {};
    results.forEach(symbol => {
        counts[symbol] = (counts[symbol] || 0) + 1;
    });
    
    const maxCount = Math.max(...Object.values(counts));
    
    if (maxCount === 5) return betAmount * 10;
    if (maxCount === 4) return betAmount * 5;
    if (maxCount === 3) return betAmount * 2;
    
    return 0;
}

// ========== ИГРА БАШНЯ ==========
function setupTowerGame() {
    const climbButton = document.getElementById('climb-btn');
    const takeButton = document.getElementById('take-btn');
    
    if (climbButton) climbButton.addEventListener('click', handleTowerClimb);
    if (takeButton) takeButton.addEventListener('click', handleTowerTake);
}

function handleTowerClimb() {
    if (towerGameActive) {
        const success = Math.random() > 0.35;
        
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
        const betInput = document.getElementById('tower-bet');
        const betAmount = parseInt(betInput.value);
        
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
        
        // Списываем ставку сразу
        updateUserBalance(-betAmount);
        updateTowerFloors();
        
        document.getElementById('tower-result').textContent = 'Игра началась! Поднимайтесь выше!';
    }
}

function handleTowerTake() {
    if (towerGameActive && towerCurrentFloor > 1) {
        endTowerGame(true);
    }
}

function updateTowerFloors() {
    const floors = document.querySelectorAll('.glass-floor');
    const resultDisplay = document.getElementById('tower-result');
    
    floors.forEach(floor => {
        const floorNumber = parseInt(floor.getAttribute('data-floor'));
        floor.classList.remove('active', 'reached', 'failed');
        
        if (floorNumber === towerCurrentFloor) {
            floor.classList.add('active');
        } else if (floorNumber < towerCurrentFloor) {
            floor.classList.add('reached');
        }
    });
    
    if (resultDisplay) {
        resultDisplay.textContent = `Этаж ${towerCurrentFloor} (${towerCurrentFloor}x)`;
    }
}

function endTowerGame(isWin) {
    const resultDisplay = document.getElementById('tower-result');
    
    if (isWin) {
        const winAmount = towerBetAmount * towerCurrentFloor;
        updateUserBalance(winAmount);
        resultDisplay.textContent = `🎉 Вы выиграли ${winAmount} ₽!`;
        resultDisplay.style.color = '#00ff88';
    } else {
        resultDisplay.textContent = '💥 Башня рухнула!';
        resultDisplay.style.color = '#ff4444';
    }
    
    resetTower();
}

function resetTower() {
    towerGameActive = false;
    towerCurrentFloor = 1;
    
    const floors = document.querySelectorAll('.glass-floor');
    floors.forEach(floor => floor.classList.remove('active', 'reached', 'failed'));
    
    const firstFloor = document.querySelector('.glass-floor[data-floor="1"]');
    if (firstFloor) firstFloor.classList.add('active');
}

// ========== ТРАНЗАКЦИИ ==========
function setupTransactions() {
    const depositBtn = document.getElementById('submit-deposit');
    const withdrawBtn = document.getElementById('submit-withdraw');
    
    if (depositBtn) depositBtn.addEventListener('click', handleDeposit);
    if (withdrawBtn) withdrawBtn.addEventListener('click', handleWithdraw);
}

function handleDeposit() {
    const amountInput = document.getElementById('deposit-amount');
    const amount = parseInt(amountInput.value);
    
    if (!amount || amount < 100) {
        alert('Минимальная сумма пополнения 100 ₽');
        return;
    }
    
    db.createDeposit(db.currentUser.id, amount);
    alert('✅ Заявка на пополнение отправлена!');
    amountInput.value = '';
    loadTransactionHistory();
}

function handleWithdraw() {
    const amountInput = document.getElementById('withdraw-amount');
    const methodInput = document.getElementById('withdraw-method');
    
    const amount = parseInt(amountInput.value);
    const method = methodInput.value.trim();
    
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
    alert('✅ Заявка на вывод отправлена!');
    amountInput.value = '';
    methodInput.value = '';
    loadTransactionHistory();
}

function loadTransactionHistory() {
    if (!db.currentUser) return;
    
    const userTransactions = db.getUserTransactions(db.currentUser.id);
    const depositList = document.getElementById('deposit-list');
    const withdrawList = document.getElementById('withdraw-list');
    
    if (depositList) {
        depositList.innerHTML = '';
        const deposits = userTransactions.filter(t => t.type === 'deposit');
        
        if (deposits.length === 0) {
            depositList.innerHTML = '<div class="glass-transaction-item">Нет заявок на пополнение</div>';
        } else {
            deposits.forEach(transaction => {
                const item = document.createElement('div');
                item.className = 'glass-transaction-item';
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${transaction.amount} ₽</strong>
                            <div style="color: var(--text-secondary); font-size: 0.9em; margin-top: 5px;">
                                ${getStatusText(transaction.status)}
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
    }
    
    if (withdrawList) {
        withdrawList.innerHTML = '';
        const withdraws = userTransactions.filter(t => t.type === 'withdraw');
        
        if (withdraws.length === 0) {
            withdrawList.innerHTML = '<div class="glass-transaction-item">Нет заявок на вывод</div>';
        } else {
            withdraws.forEach(transaction => {
                const item = document.createElement('div');
                item.className = 'glass-transaction-item';
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${transaction.amount} ₽</strong>
                            <div style="color: var(--text-secondary); font-size: 0.9em; margin-top: 5px;">
                                ${transaction.method} • ${getStatusText(transaction.status)}
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
}

function getStatusText(status) {
    const statusMap = {
        'pending': '⏳ Ожидание',
        'approved': '✅ Одобрено', 
        'rejected': '❌ Отклонено'
    };
    return statusMap[status] || status;
}

// Глобальная функция выхода
function logout() {
    db.logoutUser();
    window.location.href = 'login.html';
            }
