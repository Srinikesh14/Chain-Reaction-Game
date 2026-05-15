let ROWS = 12; 
let COLS = 6;  

const boardElement = document.getElementById('board');
const gameContainer = document.getElementById('game-container'); 
const turnIndicator = document.getElementById('turn-indicator');
const playAgainBtn = document.getElementById('play-again-btn'); 
const gameHistoryBtn = document.getElementById('game-history-btn'); 
const gameTimerEl = document.getElementById('game-timer');
const turnTimerEl = document.getElementById('turn-timer');
const btnNuke = document.getElementById('btn-nuke');

const homeScreen = document.getElementById('home-screen');
const gameScreen = document.getElementById('game-screen');
const rulesModal = document.getElementById('rules-modal');
const settingsModal = document.getElementById('settings-modal'); 
const botModal = document.getElementById('bot-modal'); 
const leaderboardList = document.getElementById('leaderboard-list');

const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

const inputCols = document.getElementById('input-cols');
const inputRows = document.getElementById('input-rows');
const colVal = document.getElementById('col-val');
const rowVal = document.getElementById('row-val');

// ==========================================
// 4-PLAYER CONFIGURATION
// ==========================================
const ALL_PLAYERS = ['p1', 'p2', 'p3', 'p4'];
const PLAYER_INFO = {
    'p1': { name: 'RED', class: 'p1-text' },
    'p2': { name: 'BLUE', class: 'p2-text' },
    'p3': { name: 'GREEN', class: 'p3-text' },
    'p4': { name: 'YELLOW', class: 'p4-text' }
};
const scoreEls = {
    'p1': document.getElementById('p1-score'), 
    'p2': document.getElementById('p2-score'),
    'p3': document.getElementById('p3-score'), 
    'p4': document.getElementById('p4-score')
};

// ==========================================
// STATE VARIABLES
// ==========================================
let activePlayers = []; 
let eliminatedPlayers = []; 
let gameState = [];
let currentPlayerIndex = 0; 
let turnCount = 1; 
let isPaused = false;
let isGameOver = false;
let isReplayMode = false; 

// AI Variables
let isVsBot = false;
let botDifficulty = 'easy';
let botPlayer = 'p2'; 

let isNukeTargeting = false;
let playerNukes = { 'p1': 1, 'p2': 1, 'p3': 1, 'p4': 1 };
let activeNukes = []; 
let PORTAL_A = { x: 1, y: 1 }; 
let PORTAL_B = { x: 4, y: 9 };
let movesSinceShift = 0; 

let gameTime = 300; 
let turnTime = 15;  
let gameInterval;
let turnInterval;
let eliminationTimeoutId = null;

let stateHistory = [];
let historyIndex = -1;

// ==========================================
// AUDIO SYNTHESIZERS (FULLY RESTORED!)
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTapSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(600, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1); 
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); 
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.1); 
}

function playWinSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const notes = [ { freq: 440.00, time: 0.0, duration: 0.1 }, { freq: 554.37, time: 0.1, duration: 0.1 }, { freq: 659.25, time: 0.2, duration: 0.1 }, { freq: 880.00, time: 0.3, duration: 0.5 } ];
    notes.forEach(note => {
        const oscillator = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
        oscillator.type = 'triangle'; oscillator.frequency.value = note.freq;
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + note.time); gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + note.time + 0.02); gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + note.time + note.duration);
        oscillator.connect(gainNode); gainNode.connect(audioCtx.destination); oscillator.start(audioCtx.currentTime + note.time); oscillator.stop(audioCtx.currentTime + note.time + note.duration);
    });
}

function playEliminationSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
    oscillator.type = 'sawtooth'; oscillator.frequency.setValueAtTime(300, audioCtx.currentTime); oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.6); 
    gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6); 
    oscillator.connect(gainNode); gainNode.connect(audioCtx.destination); oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.6);
}

function playTeleportSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(300, audioCtx.currentTime); oscillator.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 0.2); 
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2); 
    oscillator.connect(gainNode); gainNode.connect(audioCtx.destination); oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.2); 
}

function playBlackHoleSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
    oscillator.type = 'square'; oscillator.frequency.setValueAtTime(100, audioCtx.currentTime); oscillator.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.4); 
    gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4); 
    oscillator.connect(gainNode); gainNode.connect(audioCtx.destination); oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.4); 
}

function playNukeSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const bufferSize = audioCtx.sampleRate * 1.5; const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; } 
    const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(1000, audioCtx.currentTime); filter.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 1.5); 
    const gain = audioCtx.createGain(); gain.gain.setValueAtTime(1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination); noise.start();
}

// ==========================================
// MENU & SETTINGS LOGIC 
// ==========================================
document.getElementById('btn-rules').addEventListener('click', () => { rulesModal.classList.remove('hidden'); });
document.getElementById('close-rules-btn').addEventListener('click', () => { rulesModal.classList.add('hidden'); });
document.getElementById('btn-settings').addEventListener('click', () => { settingsModal.classList.remove('hidden'); });

inputCols.addEventListener('input', (e) => colVal.textContent = e.target.value);
inputRows.addEventListener('input', (e) => rowVal.textContent = e.target.value);

document.getElementById('close-settings-btn').addEventListener('click', () => {
    COLS = parseInt(inputCols.value); ROWS = parseInt(inputRows.value);
    document.documentElement.style.setProperty('--cols', COLS);
    document.documentElement.style.setProperty('--rows', ROWS);
    settingsModal.classList.add('hidden');
});

// Bot Menu Logic
document.getElementById('btn-1p').addEventListener('click', () => { botModal.classList.remove('hidden'); });
document.getElementById('close-bot-btn').addEventListener('click', () => { botModal.classList.add('hidden'); });

document.getElementById('btn-bot-easy').addEventListener('click', () => {
    botDifficulty = 'easy'; isVsBot = true; botModal.classList.add('hidden'); setupGame(2);
});
document.getElementById('btn-bot-hard').addEventListener('click', () => {
    botDifficulty = 'hard'; isVsBot = true; botModal.classList.add('hidden'); setupGame(2);
});

document.getElementById('btn-2p').addEventListener('click', () => { isVsBot = false; setupGame(2); });
document.getElementById('btn-3p').addEventListener('click', () => { isVsBot = false; setupGame(3); });
document.getElementById('btn-4p').addEventListener('click', () => { isVsBot = false; setupGame(4); });
document.getElementById('btn-back-menu').addEventListener('click', () => {
    clearInterval(gameInterval); clearInterval(turnInterval);
    gameScreen.classList.add('hidden'); homeScreen.classList.remove('hidden');
});

// Start the Replay!
gameHistoryBtn.addEventListener('click', () => {
    isReplayMode = true;
    gameHistoryBtn.classList.add('hidden');
    historyIndex = 0; 
    loadState(historyIndex);
});

btnNuke.addEventListener('click', () => {
    if (isGameOver || isPaused || isReplayMode) return;
    const activePlayer = activePlayers[currentPlayerIndex];
    if (playerNukes[activePlayer] > 0) {
        isNukeTargeting = !isNukeTargeting;
        if (isNukeTargeting) {
            btnNuke.textContent = "CANCEL BOMB"; btnNuke.classList.add('active-targeting');
        } else { updateTurnUI(); }
        renderBoard(); 
    }
});

function setupGame(playerCount) {
    activePlayers = ALL_PLAYERS.slice(0, playerCount);
    ALL_PLAYERS.forEach(p => {
        const block = document.getElementById(`score-block-${p}`);
        if (activePlayers.includes(p)) block.classList.remove('hidden');
        else block.classList.add('hidden');
    });
    homeScreen.classList.add('hidden'); gameScreen.classList.remove('hidden');
    initGame();
}

// ==========================================
// THE TIME MACHINE LOGIC
// ==========================================
function saveState() {
    if (historyIndex < stateHistory.length - 1) stateHistory = stateHistory.slice(0, historyIndex + 1);
    
    let currentState = JSON.stringify({
        ROWS: ROWS, COLS: COLS, 
        gameState: gameState, currentPlayerIndex: currentPlayerIndex, turnCount: turnCount,
        movesSinceShift: movesSinceShift, PORTAL_A: PORTAL_A, PORTAL_B: PORTAL_B,
        playerNukes: playerNukes, eliminatedPlayers: eliminatedPlayers, 
        activePlayers: activePlayers, gameTime: gameTime, isGameOver: isGameOver,
        activeNukes: activeNukes 
    });
    
    stateHistory.push(currentState); historyIndex++; updateTimeButtons();
}

function loadState(index) {
    if (eliminationTimeoutId) clearTimeout(eliminationTimeoutId); 
    let past = JSON.parse(stateHistory[index]);
    
    ROWS = past.ROWS || 12; COLS = past.COLS || 6;
    document.documentElement.style.setProperty('--cols', COLS); document.documentElement.style.setProperty('--rows', ROWS);

    gameState = past.gameState; currentPlayerIndex = past.currentPlayerIndex; turnCount = past.turnCount; movesSinceShift = past.movesSinceShift;
    PORTAL_A = past.PORTAL_A; PORTAL_B = past.PORTAL_B; playerNukes = past.playerNukes; eliminatedPlayers = past.eliminatedPlayers; activePlayers = past.activePlayers;
    gameTime = past.gameTime; isGameOver = past.isGameOver; activeNukes = past.activeNukes ? past.activeNukes : []; 

    isPaused = false; isNukeTargeting = false;

    if (isReplayMode) {
        playAgainBtn.classList.remove('hidden'); gameHistoryBtn.classList.add('hidden'); btnNuke.classList.add('hidden');
        clearInterval(gameInterval); clearInterval(turnInterval); updateTimerUI(); 
    } else {
        if (isGameOver) {
            playAgainBtn.classList.remove('hidden'); gameHistoryBtn.classList.remove('hidden'); btnNuke.classList.add('hidden');
            clearInterval(gameInterval); clearInterval(turnInterval);
        } else {
            playAgainBtn.classList.add('hidden'); gameHistoryBtn.classList.add('hidden'); startTimers(); 
        }
    }
    updateTurnUI(); renderBoard(); updateLeaderboard(); updateTimeButtons();
}

function updateTimeButtons() {
    btnPrev.disabled = (historyIndex <= 0); btnNext.disabled = (historyIndex >= stateHistory.length - 1);
}

btnPrev.addEventListener('click', () => { if (historyIndex > 0) { historyIndex--; loadState(historyIndex); playTapSound(); } });
btnNext.addEventListener('click', () => { if (historyIndex < stateHistory.length - 1) { historyIndex++; loadState(historyIndex); playTapSound(); } });

function updateLeaderboard() {
    leaderboardList.innerHTML = '';
    let scores = activePlayers.map(p => { return { id: p, score: getPlayerOrbCount(p), name: PLAYER_INFO[p].name, color: PLAYER_INFO[p].class }; });
    scores.sort((a, b) => b.score - a.score);
    scores.forEach(s => {
        const li = document.createElement('li'); li.className = s.color;
        const textStyle = eliminatedPlayers.includes(s.id) ? 'text-decoration: line-through; opacity: 0.5;' : '';
        li.innerHTML = `<span style="${textStyle}">${s.name}</span> <span>${s.score}</span>`; leaderboardList.appendChild(li);
    });
}

// ==========================================
// CORE GAME LOGIC
// ==========================================
function initGame() {
    gameState = []; eliminatedPlayers = []; stateHistory = []; historyIndex = -1; activeNukes = [];
    currentPlayerIndex = 0; turnCount = 1; movesSinceShift = 0;
    
    PORTAL_A = { x: 1, y: 1 }; PORTAL_B = { x: COLS - 2, y: ROWS - 2 };
    
    isPaused = false; isGameOver = false; isReplayMode = false; isNukeTargeting = false;
    playerNukes = { 'p1': 1, 'p2': 1, 'p3': 1, 'p4': 1 }; 
    gameTime = 300; 
    
    playAgainBtn.classList.add('hidden'); gameHistoryBtn.classList.add('hidden');
    
    for (let r = 0; r < ROWS; r++) {
        let row = [];
        for (let c = 0; c < COLS; c++) { row.push({ owner: null, mass: 0 }); }
        gameState.push(row);
    }
    updateTurnUI(); renderBoard(); updateLeaderboard(); startTimers(); saveState(); 
    triggerBotIfNecessary();
}

function startTimers() {
    clearInterval(gameInterval); clearInterval(turnInterval);
    gameInterval = setInterval(() => {
        if (!isPaused && !isGameOver && !isReplayMode) { 
            gameTime--; 
            updateTimerUI(); 
            if (gameTime <= 0) handleTimeout(); // NEW TIMEOUT LOGIC
        }
    }, 1000); resetTurnTimer();
}

// NEW: Calculates the winner based on map control if time expires
function handleTimeout() {
    let maxOrbs = -1;
    let winners = [];

    activePlayers.forEach(p => {
        if (!eliminatedPlayers.includes(p)) {
            let count = getPlayerOrbCount(p);
            if (count > maxOrbs) {
                maxOrbs = count;
                winners = [p];
            } else if (count === maxOrbs) {
                winners.push(p);
            }
        }
    });

    if (winners.length === 1) {
        endGame(`TIME'S UP! ${PLAYER_INFO[winners[0]].name} WINS ON ORBS!`, winners[0]);
    } else {
        // If there's an exact tie in orb counts at 0:00
        endGame("TIME'S UP! TIE GAME!", null);
    }
}

function resetTurnTimer() {
    turnTime = 15; updateTimerUI(); clearInterval(turnInterval);
    turnInterval = setInterval(() => { 
        if (!isPaused && !isGameOver && !isReplayMode) { turnTime--; updateTimerUI(); if (turnTime <= 0) finishTurn(); } 
    }, 1000);
}

function updateTimerUI() {
    let minutes = Math.floor(gameTime / 60); let seconds = gameTime % 60;
    gameTimerEl.textContent = `${minutes < 10 ? '0':''}${minutes}:${seconds < 10 ? '0':''}${seconds}`; turnTimerEl.textContent = `${turnTime}s`;
}

function getCapacity(x, y) {
    const isCorner = (x===0 && y===0) || (x===COLS-1 && y===0) || (x===0 && y===ROWS-1) || (x===COLS-1 && y===ROWS-1);
    const isEdge = x===0 || x===COLS-1 || y===0 || y===ROWS-1;
    if (isCorner) return 2; if (isEdge) return 3; return 4; 
}

function getTeleportDest(x, y) {
    if (x === PORTAL_A.x && y === PORTAL_A.y) return { x: PORTAL_B.x, y: PORTAL_B.y, isDestroyed: false };
    if (x === PORTAL_B.x && y === PORTAL_B.y) return { isDestroyed: true }; 
    return { x: x, y: y, isDestroyed: false };
}

function renderBoard() {
    boardElement.innerHTML = ''; 
    const activePlayer = activePlayers[currentPlayerIndex];

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cellData = gameState[r][c];
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('cell'); cellDiv.dataset.x = c; cellDiv.dataset.y = r; cellDiv.dataset.mass = cellData.mass;
            
            if (c === PORTAL_A.x && r === PORTAL_A.y) cellDiv.classList.add('portal-entry');
            if (c === PORTAL_B.x && r === PORTAL_B.y) cellDiv.classList.add('portal-exit');
            
            let dest = getTeleportDest(c, r);
            let isValidMove = false;

            if (!isGameOver && !isPaused && !isReplayMode) {
                if (isNukeTargeting) {
                    if (!dest.isDestroyed) isValidMove = true;
                } else {
                    if (!dest.isDestroyed) {
                        let destCell = gameState[dest.y][dest.x];
                        if (turnCount <= activePlayers.length && destCell.owner === null) isValidMove = true; 
                        else if (turnCount > activePlayers.length && destCell.owner === activePlayer) isValidMove = true; 
                    }
                }
            }

            if (isValidMove) { cellDiv.classList.add(isNukeTargeting ? 'valid-nuke-target' : 'valid-move'); }
            
            if (cellData.owner !== null) {
                cellDiv.dataset.owner = cellData.owner;
                for (let i = 0; i < cellData.mass; i++) {
                    const orb = document.createElement('div'); orb.classList.add('orb'); cellDiv.appendChild(orb);
                }
            }
            
            let bomb = activeNukes.find(n => n.x === c && n.y === r);
            if (bomb) {
                const bombOverlay = document.createElement('div');
                bombOverlay.classList.add('time-bomb'); bombOverlay.textContent = bomb.fuse; cellDiv.appendChild(bombOverlay);
            }
            boardElement.appendChild(cellDiv);
        }
    }
}

// ==========================================
// PLAYER & AI ENGINE INTERACTION
// ==========================================
boardElement.addEventListener('click', function(event) {
    if (isPaused || isGameOver || isReplayMode) return; 
    if (isVsBot && activePlayers[currentPlayerIndex] === botPlayer) return;

    const cellElement = event.target.closest('.cell');
    if (!cellElement) return; 
    if (!cellElement.classList.contains('valid-move') && !cellElement.classList.contains('valid-nuke-target')) return;

    const x = parseInt(cellElement.dataset.x); const y = parseInt(cellElement.dataset.y);
    handleMove(x, y);
});

function handleMove(x, y) {
    const activePlayer = activePlayers[currentPlayerIndex];

    if (isNukeTargeting) {
        playerNukes[activePlayer]--; isNukeTargeting = false; playTapSound(); 
        activeNukes.push({ x: x, y: y, fuse: activePlayers.length, owner: activePlayer }); 
        finishTurn(); return;
    }

    let dest = getTeleportDest(x, y);
    if (dest.isDestroyed) return; 
    const targetCell = gameState[dest.y][dest.x];

    if (dest.x !== x || dest.y !== y) { playTeleportSound(); } 

    if (turnCount <= activePlayers.length) {
        if (targetCell.owner === null) {
            targetCell.owner = activePlayer; targetCell.mass = getCapacity(dest.x, dest.y) - 1;
            if (dest.x === x && dest.y === y) playTapSound(); 
            processChainReactions(activePlayer); finishTurn();
        }
    } else {
        if (targetCell.owner === activePlayer) {
            targetCell.mass += 1;
            if (dest.x === x && dest.y === y) playTapSound(); 
            processChainReactions(activePlayer); finishTurn();
        }
    }
}

// --- THE AI BOT ENGINE ---
function triggerBotIfNecessary() {
    if (isGameOver || isReplayMode || isPaused) return;
    if (isVsBot && activePlayers[currentPlayerIndex] === botPlayer) {
        setTimeout(playBotTurn, 800); 
    }
}

function playBotTurn() {
    if (isGameOver || isPaused || isReplayMode || activePlayers[currentPlayerIndex] !== botPlayer) return;
    
    let validMoves = [];
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let dest = getTeleportDest(c, r);
            if (dest.isDestroyed) continue;
            
            let destCell = gameState[dest.y][dest.x];
            let isValid = false;

            if (turnCount <= activePlayers.length && destCell.owner === null) isValid = true;
            else if (turnCount > activePlayers.length && destCell.owner === botPlayer) isValid = true;

            if (isValid) validMoves.push({x: c, y: r, destX: dest.x, destY: dest.y});
        }
    }

    if (validMoves.length === 0) return; 

    let chosenMove;

    if (botDifficulty === 'easy') {
        chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    } 
    else {
        let bestScore = -Infinity;
        let bestMoves = [];

        validMoves.forEach(move => {
            let score = 0;
            let cap = getCapacity(move.destX, move.destY);
            let cell = gameState[move.destY][move.destX];
            let willExplode = (cell.mass + 1 === cap);

            if (willExplode) score += 5; 
            if (cap === 2) score += 3;   
            if (cap === 3) score += 1;   

            const neighbors = [
                {nx: move.destX, ny: move.destY - 1}, {nx: move.destX, ny: move.destY + 1},
                {nx: move.destX - 1, ny: move.destY}, {nx: move.destX + 1, ny: move.destY}
            ];

            neighbors.forEach(n => {
                if (n.nx >= 0 && n.nx < COLS && n.ny >= 0 && n.ny < ROWS) {
                    let nDest = getTeleportDest(n.nx, n.ny);
                    if (!nDest.isDestroyed) {
                        let nCell = gameState[nDest.y][nDest.x];
                        let nCap = getCapacity(nDest.x, nDest.y);

                        if (nCell.owner && nCell.owner !== botPlayer) {
                            if (willExplode) score += 15; 
                            if (nCell.mass === nCap - 1 && !willExplode) score -= 20; 
                        }
                    }
                }
            });

            if (score > bestScore) { bestScore = score; bestMoves = [move]; } 
            else if (score === bestScore) { bestMoves.push(move); } 
        });

        chosenMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];

        if (playerNukes[botPlayer] > 0 && turnCount > 5 && Math.random() < 0.15) {
            isNukeTargeting = true;
            let enemyCells = [];
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (gameState[r][c].owner && gameState[r][c].owner !== botPlayer) enemyCells.push({x: c, y: r});
                }
            }
            if (enemyCells.length > 0) chosenMove = enemyCells[Math.floor(Math.random() * enemyCells.length)];
        }
    }

    handleMove(chosenMove.x, chosenMove.y);
}

// ==========================================
// PHYSICS PROCESSING
// ==========================================
function processChainReactions(explodingPlayer) {
    let explosionsThisTick = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (gameState[r][c].mass >= getCapacity(c, r)) explosionsThisTick.push({ x: c, y: r });
        }
    }

    if (explosionsThisTick.length > 0) {
        explosionsThisTick.forEach(pos => {
            const x = pos.x; const y = pos.y; const cell = gameState[y][x];
            cell.mass -= getCapacity(x, y); if (cell.mass === 0) cell.owner = null;
            
            const neighbors = [{nx:x, ny:y-1}, {nx:x, ny:y+1}, {nx:x-1, ny:y}, {nx:x+1, ny:y}];
            neighbors.forEach(n => {
                if (n.nx >= 0 && n.nx < COLS && n.ny >= 0 && n.ny < ROWS) {
                    let dest = getTeleportDest(n.nx, n.ny);
                    if (dest.isDestroyed) { playBlackHoleSound(); } 
                    else {
                        const neighborCell = gameState[dest.y][dest.x];
                        neighborCell.owner = explodingPlayer; neighborCell.mass += 1;   
                    }          
                }
            });
        });
        processChainReactions(explodingPlayer);
    }
}

function shiftPortals() {
    let emptyCells = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) { if (gameState[r][c].mass === 0) emptyCells.push({x: c, y: r}); }
    }
    if (emptyCells.length >= 2) {
        emptyCells.sort(() => Math.random() - 0.5);
        PORTAL_A = emptyCells[0]; PORTAL_B = emptyCells[1];
        playTeleportSound(); 
    }
}

// ==========================================
// SCORING, BOMBS & TURN MANAGEMENT
// ==========================================
function getPlayerOrbCount(playerID) {
    let count = 0;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) { if (gameState[r][c].owner === playerID) count += gameState[r][c].mass; }
    }
    return count;
}

function updateScoresAndCheckWin() {
    let activePlayersCount = 0; let lastActivePlayerID = null; let newlyEliminated = [];
    activePlayers.forEach(playerID => {
        let count = getPlayerOrbCount(playerID);
        scoreEls[playerID].textContent = count;
        
        if (turnCount > activePlayers.length) {
            if (count > 0) { activePlayersCount++; lastActivePlayerID = playerID; } 
            else if (!eliminatedPlayers.includes(playerID)) { eliminatedPlayers.push(playerID); newlyEliminated.push(playerID); }
        }
    });

    updateLeaderboard(); 

    if (turnCount > activePlayers.length) {
        if (activePlayersCount === 1) endGame(`${PLAYER_INFO[lastActivePlayerID].name} WON!`, lastActivePlayerID);
        else if (activePlayersCount === 0) endGame("MUTUAL DESTRUCTION (DRAW)!", null);
    }
    return newlyEliminated;
}

function finishTurn() {
    turnCount++; turnTime = 15; isNukeTargeting = false;
    
    movesSinceShift++;
    if (movesSinceShift >= 4 && turnCount > activePlayers.length) { shiftPortals(); movesSinceShift = 0; }
    
    let bombDidExplode = false;
    activeNukes.forEach(nuke => nuke.fuse--); 
    let nukesToDetonate = activeNukes.filter(n => n.fuse <= 0);
    activeNukes = activeNukes.filter(n => n.fuse > 0); 

    if (nukesToDetonate.length > 0) {
        bombDidExplode = true;
        playNukeSound();
        gameContainer.classList.add('shake-screen');
        setTimeout(() => gameContainer.classList.remove('shake-screen'), 500);

        nukesToDetonate.forEach(nuke => {
            const blastZone = [
                { x: nuke.x, y: nuke.y },     { x: nuke.x, y: nuke.y - 1 }, 
                { x: nuke.x, y: nuke.y + 1 }, { x: nuke.x - 1, y: nuke.y }, 
                { x: nuke.x + 1, y: nuke.y }  
            ];
            blastZone.forEach(pos => {
                let r = pos.y; let c = pos.x;
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                    if ((c === PORTAL_A.x && r === PORTAL_A.y) || (c === PORTAL_B.x && r === PORTAL_B.y)) return; 
                    gameState[r][c].mass = 0; gameState[r][c].owner = null;
                }
            });
        });
    }
    
    let newlyEliminated = updateScoresAndCheckWin(); 
    
    if (!isGameOver) {
        do { currentPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
        } while (turnCount > activePlayers.length && getPlayerOrbCount(activePlayers[currentPlayerIndex]) === 0);

        if (newlyEliminated.length > 0 || bombDidExplode) {
            isPaused = true; 
            if (newlyEliminated.length > 0) {
                playEliminationSound();
                const deadPlayer = PLAYER_INFO[newlyEliminated[0]];
                turnIndicator.textContent = `${deadPlayer.name} IS OUT OF THE CONTEXT!`; turnIndicator.className = deadPlayer.class; 
            }
            
            renderBoard(); updateLeaderboard(); 
            
            eliminationTimeoutId = setTimeout(() => {
                isPaused = false;
                if (!isGameOver) { updateTurnUI(); resetTurnTimer(); renderBoard(); saveState(); triggerBotIfNecessary(); } 
            }, newlyEliminated.length > 0 ? 2000 : 800); 
            
        } else { 
            updateTurnUI(); renderBoard(); resetTurnTimer(); saveState(); triggerBotIfNecessary();
        }
    }
}

function endGame(message, winnerID) {
    isGameOver = true; clearInterval(gameInterval); clearInterval(turnInterval);
    if (message && message.includes("WON")) playWinSound(); 
    
    turnIndicator.textContent = message; 
    if (winnerID) { turnIndicator.className = PLAYER_INFO[winnerID].class; } 
    else { turnIndicator.className = ''; turnIndicator.style.color = "#000000"; }
    
    playAgainBtn.classList.remove('hidden'); gameHistoryBtn.classList.remove('hidden'); btnNuke.classList.add('hidden'); renderBoard();
    saveState(); 
}

function updateTurnUI() {
    if (isReplayMode) {
        const activePlayer = activePlayers[currentPlayerIndex];
        if (isGameOver) {
            turnIndicator.textContent = "REPLAY: GAME OVER STATE"; turnIndicator.className = '';
        } else {
            turnIndicator.textContent = `REPLAY: ${PLAYER_INFO[activePlayer].name}'s Turn`; turnIndicator.className = PLAYER_INFO[activePlayer].class;
        }
        btnNuke.classList.add('hidden');
        return;
    }

    if (isGameOver) return;
    
    const activePlayer = activePlayers[currentPlayerIndex];
    turnIndicator.textContent = `${PLAYER_INFO[activePlayer].name} Player's Turn`; turnIndicator.className = PLAYER_INFO[activePlayer].class; 
    
    btnNuke.classList.remove('hidden', 'active-targeting');
    btnNuke.textContent = `PLANT BOMB (${playerNukes[activePlayer]})`;
    if (playerNukes[activePlayer] <= 0 || turnCount <= activePlayers.length || isVsBot && activePlayer === botPlayer) {
        btnNuke.disabled = true; 
    } else {
        btnNuke.disabled = false;
    }
}

document.addEventListener('keydown', function(event) {
    if (isGameOver || isReplayMode || gameScreen.classList.contains('hidden')) return; 
    if (event.key.toLowerCase() === 'p') {
        isPaused = !isPaused;
        if (isPaused) { turnIndicator.textContent = "PAUSED (Press 'P')"; turnIndicator.className = ''; turnIndicator.style.color = "#000000"; btnNuke.classList.add('hidden'); } 
        else { updateTurnUI(); }
        renderBoard(); 
    }
});

playAgainBtn.addEventListener('click', initGame);
