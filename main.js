// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let crashGameActive = false;
let currentMultiplier = 1.0;
let crashInterval = null;
let currentBetAmount = 0;

let towerCurrentFloor = 1;
let towerBetAmount = 0;
let towerGameActive = false;

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
    
    // Проверяем авторизацию
    if (!db.currentUser && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
        window.location.href = 'login.html';
        return;
    }
    
    if (db.currentUser) {
        updateUserInfo();
        loadTransactionHistory();
    }
}

// ========== НАВИГАЦИЯ ==========
function setupNavigation() {
    const navButtons = document.querySelectorAll('.glass-nav-btn');
    const gameSections = document.querySelectorAll('.glass-section');

    console.log('Setting up navigation for', navButtons.length, 'buttons');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Navigation button clicked:', this.getAttribute('data-game'));
            const game = this.getAttribute('data-game');
            
            // Убираем активный класс у всех кнопок
            navButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Скрываем все секции
            gameSections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Показываем нужную секцию
            const targetSection = document.getElementById(game + '-game');
            if (targetSection) {
                targetSection.classList.add('active');
                console.log('Showing section:', game);
            }
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
        console.log('Setting up Crash game...');
        betButton.addEventListener('click', handleCrashBet);
    } else {
        console.log('Crash button not found');
    }
}

function handleCrashBet() {
    console.log('Crash bet button clicked');
    
    if (crashGameActive) {
        cashOut();
        return;
    }
    
    const amountInput = document.getElementById('bet-amount');
    if (!amountInput) {
        alert('Поле ставки не найдено');
        return;
    }
    
    const amount = parseInt(amountInput.value);
    console.log('Bet amount:', amount);
    
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
    console.log('Starting crash game with bet:', betAmount);
    crashGameActive = true;
    currentMultiplier = 1.0;
    currentBetAmount = betAmount;
    
    const betButton = document.getElementById('place-bet');
    const multiplierDisplay = document.getElementById('current-multiplier');
    const rocketElement = document.getElementById('rocket-container');
    
    if (!rocketElement) {
        console.error('Rocket element not found!');
        return;
    }
    
    betButton.textContent = '💰 Забрать';
    
    // Вычитаем ставку из баланса
    db.updateUserBalance(db.currentUser.id, -betAmount);
    updateUserInfo();
    
    // Сбрасываем позицию ракеты
    rocketElement.style.bottom = '40px';
    
    // Запускаем игровой цикл
    crashInterval = setInterval(() => {
        if (!crashGameActive) return;
        
        // Увеличиваем множитель
        currentMultiplier += 0.03;
        if (multiplierDisplay) {
            multiplierDisplay.textContent = currentMultiplier.toFixed(2) + 'x';
        }
        
        // Поднимаем ракету
        const currentBottom = parseInt(rocketElement.style.bottom) || 40;
        const newBottom = Math.max(5, currentBottom - 3);
        rocketElement.style.bottom = newBottom + 'px';
        
        // Меняем цвет
        if (multiplierDisplay) {
            if (currentMultiplier > 2) multiplierDisplay.style.color = '#ffaa00';
            if (currentMultiplier > 3) multiplierDisplay.style.color = '#ff4444';
            if (currentMultiplier > 5) multiplierDisplay.style.color = '#ff0066';
        }
        
        // Случайный краш
        const crashChance = Math.min(0.5, currentMultiplier * 0.02);
        if (Math.random() < crashChance) {
            endCrashGame(false);
        }
        
    }, 100);
}

function cashOut() {
    console.log('Cashing out at multiplier:', currentMultiplier);
    if (crashGameActive && currentMultiplier > 1.0) {
        endCrashGame(true);
    }
}

function endCrashGame(isWin) {
    console.log('Ending crash game, win:', isWin);
    clearInterval(crashInterval);
    crashGameActive = false;
    
    const betButton = document.getElementById('place-bet');
    const multiplierDisplay = document.getElementById('current-multiplier');
    
    if (betButton) {
        betButton.textContent = 'Сделать ставку';
    }
    
    if (isWin) {
        const winAmount = Math.floor(currentBetAmount * currentMultiplier);
        db.updateUserBalance(db.currentUser.id, winAmount);
        
        addToCrashHistory(currentMultiplier.toFixed(2) + 'x', true);
        
        if (multiplierDisplay) {
            multiplierDisplay.style.color = '#00ff88';
        }
        
        setTimeout(() => {
            alert(`🎉 Вы выиграли ${winAmount} ₽ (${currentMultiplier.toFixed(2)}x)!`);
        }, 300);
    } else {
        addToCrashHistory(currentMultiplier.toFixed(2) + 'x', false);
        
        const rocketElement = document.getElementById('rocket-container');
        if (rocketElement) {
            rocketElement.style.animation = 'glassShake 0.8s ease-in-out';
        }
        
        setTimeout(() => {
            alert(`💥 Краш на ${currentMultiplier.toFixed(2)}x! Ставка проиграна.`);
            if (rocketElement) {
                rocketElement.style.animation = '';
            }
        }, 300);
    }
    
    updateUserInfo();
    
    // Сброс игры
    setTimeout(() => {
        if (multiplierDisplay) {
            multiplierDisplay.textContent = '1.00x';
            multiplierDisplay.style.color = '';
        }
        const rocketElement = document.getElementById('rocket-container');
        if (rocketElement) {
            rocketElement.style.bottom = '40px';
        }
    }, 2000);
}

function addToCrashHistory(multiplier, isWin) {
    const historyContainer = document.querySelector('.glass-history');
    if (!historyContainer) return;
    
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
        console.log('Setting up Slots game...');
        spinButton.addEventListener('click', handleSlotsSpin);
    }
}

function handleSlotsSpin() {
    console.log('Slots spin button clicked');
    
    const betInput = document.getElementById('slots-bet');
    if (!betInput) return;
    
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
    
    if (!spinButton || !resultDisplay) return;
    
    spinButton.disabled = true;
    spinButton.innerHTML = '<div class="glass-loader"></div> Крутится...';
    
    // Вычитаем ставку
    db.updateUserBalance(db.currentUser.id, -betAmount);
    updateUserInfo();
    
    // Анимация вращения
    reels.forEach(reel => {
        if (reel) reel.classList.add('spinning');
    });
    
    // Определяем результат через 2 секунды
    setTimeout(() => {
        const symbols = ['🍒', '🍋', '🍊', '⭐', '7️⃣', '💎'];
        const results = [];
        
        reels.forEach((reel, index) => {
            if (reel) {
                reel.classList.remove('spinning');
                const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                reel.textContent = randomSymbol;
                results[index] = randomSymbol;
            }
        });
        
        // Проверяем выигрыш
        const winAmount = calculateSlotsWin(results, betAmount);
        
        if (winAmount > 0) {
            db.updateUserBalance(db.currentUser.id, winAmount);
            resultDisplay.textContent = `🎉 Выигрыш ${winAmount} ₽!`;
            resultDisplay.style.color = '#00ff88';
        } else {
            resultDisplay.textContent = 'Попробуйте еще раз!';
            resultDisplay.style.color = '#ff4444';
        }
        
        updateUserInfo();
        spinButton.disabled = false;
        spinButton.textContent = '🎯 Крутить';
        
    }, 2000);
}

function calculateSlotsWin(results, betAmount) {
    // Простая логика выигрыша
    const counts = {};
    results.forEach(symbol => {
        counts[symbol] = (counts[symbol] || 0) + 1;
    });
    
    const maxCount = Math.max(...Object.values(counts));
    
    if (maxCount === 5) return betAmount * 10; // 5 одинаковых
    if (maxCount === 4) return betAmount * 5;  // 4 одинаковых  
    if (maxCount === 3) return betAmount * 2;  // 3 одинаковых
    
    return 0;
}

// ========== ИГРА БАШНЯ ==========
function setupTowerGame() {
    const climbButton = document.getElementById('climb-btn');
    const takeButton = document.getElementById('take-btn');
    
    if (climbButton) {
        console.log('Setting up Tower game...');
        climbButton.addEventListener('click', handleTowerClimb);
    }
    
    if (takeButton) {
        takeButton.addEventListener('click', handleTowerTake);
    }
}

function handleTowerClimb() {
    console.log('Tower climb button clicked');
    
    if (towerGameActive) {
        // Продолжаем игру
        const success = Math.random() > 0.35; // 65% шанс успеха
        
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
        // Начинаем новую игру
        const betInput = document.getElementById('tower-bet');
        if (!betInput) return;
        
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
        
        db.updateUserBalance(db.currentUser.id, -betAmount);
        updateUserInfo();
        updateTowerFloors();
        
        document.getElementById('tower-result').textContent = 'Игра началась! Поднимайтесь выше!';
    }
}

function handleTowerTake() {
    console.log('Tower take button clicked');
    
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
        db.updateUserBalance(db.currentUser.id, winAmount);
        
        if (resultDisplay) {
            resultDisplay.textContent = `🎉 Вы выиграли ${winAmount} ₽!`;
            resultDisplay.style.color = '#00ff88';
        }
    } else {
        if (resultDisplay) {
            resultDisplay.textContent = '💥 Башня рухнула!';
            resultDisplay.style.color = '#ff4444';
        }
    }
    
    updateUserInfo();
    resetTower();
}

function resetTower() {
    towerGameActive = false;
    towerCurrentFloor = 1;
    
    const floors = document.querySelectorAll('.glass-floor');
    floors.forEach(floor => {
        floor.classList.remove('active', 'reached', 'failed');
    });
    
    // Активируем первый этаж
    const firstFloor = document.querySelector('.glass-floor[data-floor="1"]');
    if (firstFloor) {
        firstFloor.classList.add('active');
    }
}

// ========== ТРАНЗАКЦИИ ==========
function setupTransactions() {
    const depositBtn = document.getElementById('submit-deposit');
    const withdrawBtn = document.getElementById('submit-withdraw');
    
    if (depositBtn) {
        console.log('Setting up deposit button...');
        depositBtn.addEventListener('click', handleDeposit);
    }
    
    if (withdrawBtn) {
        console.log('Setting up withdraw button...');
        withdrawBtn.addEventListener('click', handleWithdraw);
    }
}

function handleDeposit() {
    console.log('Deposit button clicked');
    
    const amountInput = document.getElementById('deposit-amount');
    if (!amountInput) return;
    
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
    console.log('Withdraw button clicked');
    
    const amountInput = document.getElementById('withdraw-amount');
    const methodInput = document.getElementById('withdraw-method');
    
    if (!amountInput || !methodInput) return;
    
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

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function updateUserInfo() {
    if (db.currentUser) {
        const usernameElement = document.getElementById('username');
        const balanceElement = document.getElementById('balance');
        
        if (usernameElement) usernameElement.textContent = db.currentUser.username;
        if (balanceElement) balanceElement.textContent = db.currentUser.balance + ' ₽';
    }
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
