const socket = io();

// Elementos da interface
const loginScreen = document.getElementById("login-screen");
const lobbyScreen = document.getElementById("lobby-screen");
const quizScreen = document.getElementById("quiz-screen");
const leaderboardScreen = document.getElementById("leaderboard-screen");
const resultScreen = document.getElementById("result-screen");

const playerNameInput = document.getElementById("player-name");
const joinBtn = document.getElementById("join-btn");
const startGameBtn = document.getElementById("start-game-btn");
const restartBtn = document.getElementById("restart-btn");

const playersList = document.getElementById("players-list");
const leaderboardList = document.getElementById("leaderboard-list");
const finalLeaderboardList = document.getElementById("final-leaderboard-list");

const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const questionCount = document.getElementById("question-count");
const timerDisplay = document.getElementById("timer-display");
const timerPath = document.getElementById("timer-path");
const waitingMsg = document.getElementById("waiting-msg");

const roundFeedback = document.getElementById("round-feedback");
const feedbackIcon = document.getElementById("feedback-icon");
const feedbackTitle = document.getElementById("feedback-title");
const feedbackSubtitle = document.getElementById("feedback-subtitle");

const winnerNameSpan = document.getElementById("winner-name");
const winnerScoreSpan = document.getElementById("winner-score");

let myName = "";
let currentOptions = [];
let myAnswer = null;

const letters = ["A", "B", "C", "D"];

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// 1. Entrar no Jogo
joinBtn.addEventListener("click", () => {
    myName = playerNameInput.value.trim();
    if (!myName) myName = "Anônimo " + Math.floor(Math.random() * 1000);
    socket.emit('join', myName);
    showScreen(lobbyScreen);
});

playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinBtn.click();
});

// 2. Atualizar o Lobby
socket.on('updateLobby', (players) => {
    playersList.innerHTML = "";
    players.forEach(p => {
        const div = document.createElement("div");
        div.classList.add("player-chip");
        div.textContent = p.name;
        playersList.appendChild(div);
    });
});

// 3. Iniciar Jogo
startGameBtn.addEventListener("click", () => {
    socket.emit('startGame');
});

// 4. Receber Nova Pergunta
socket.on('newQuestion', (data) => {
    showScreen(quizScreen);
    waitingMsg.classList.add('hidden');
    optionsContainer.classList.remove('answered', 'show-answer');
    myAnswer = null;
    
    questionText.textContent = data.question;
    questionCount.textContent = `Q ${data.questionNumber}/${data.totalQuestions}`;
    updateTimer(data.timeLeft, 15);

    optionsContainer.innerHTML = "";
    currentOptions = data.options;

    data.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.className = "option-card";
        button.innerHTML = `
            <div class="option-letter">${letters[index]}</div>
            <span>${option}</span>
        `;
        button.onclick = () => submitAnswer(index, button);
        optionsContainer.appendChild(button);
    });
});

function updateTimer(timeLeft, maxTime = 15) {
    timerDisplay.textContent = timeLeft;
    const percentage = (timeLeft / maxTime) * 100;
    timerPath.style.strokeDasharray = `${percentage}, 100`;
    
    if (timeLeft <= 5) {
        timerPath.style.stroke = "var(--error)";
    } else {
        timerPath.style.stroke = "var(--secondary)";
    }
}

// Cronômetro
socket.on('timer', (timeLeft) => {
    updateTimer(timeLeft, 15);
});

// 5. Enviar Resposta
function submitAnswer(selectedIndex, button) {
    myAnswer = selectedIndex;
    socket.emit('submitAnswer', selectedIndex);
    
    // Desativar botões
    const options = document.querySelectorAll(".option-card");
    options.forEach(opt => opt.disabled = true);
    
    optionsContainer.classList.add('answered');
    button.classList.add('selected');

    waitingMsg.classList.remove('hidden');
}

// 6. Mostrar Resposta e Placar Parcial
socket.on('showAnswer', (results) => {
    optionsContainer.classList.add('show-answer');
    
    // Revelar resposta correta
    const options = document.querySelectorAll(".option-card");
    options.forEach((btn, index) => {
        if (index === results.correctAnswer) {
            btn.classList.add('correct');
        } else if (index === myAnswer) {
            btn.classList.add('incorrect'); // marca de vermelho o erro de quem errou
        }
    });

    setTimeout(() => {
        showScreen(leaderboardScreen);
        
        roundFeedback.classList.remove('correct', 'incorrect');
        if (myAnswer === results.correctAnswer) {
            feedbackIcon.textContent = "✨";
            feedbackTitle.textContent = "Correto!";
            feedbackSubtitle.textContent = "+10 pontos";
            roundFeedback.classList.add('correct');
        } else if (myAnswer === null) {
            feedbackIcon.textContent = "⏳";
            feedbackTitle.textContent = "Tempo Esgotado!";
            feedbackSubtitle.textContent = "Mais sorte na próxima";
            roundFeedback.classList.add('incorrect');
        } else {
            feedbackIcon.textContent = "❌";
            feedbackTitle.textContent = "Incorreto!";
            feedbackSubtitle.textContent = "A resposta era a Letra " + letters[results.correctAnswer];
            roundFeedback.classList.add('incorrect');
        }
        
        // Popula Placar Parcial
        leaderboardList.innerHTML = "";
        results.players.slice(0, 5).forEach((p, index) => { // Top 5
            const li = document.createElement("li");
            li.innerHTML = `<span>${index + 1}. ${p.name}</span> <span>${p.score} pts</span>`;
            leaderboardList.appendChild(li);
        });
    }, 2500);
});

// Volta ao lobby
socket.on('goToLobby', () => {
    showScreen(lobbyScreen);
});

// 7. Fim de Jogo
socket.on('gameOver', (players) => {
    showScreen(resultScreen);
    
    finalLeaderboardList.innerHTML = "";
    players.slice(0, 5).forEach((p, index) => {
        const li = document.createElement("li");
        let prefix = `${index + 1}.`;
        if (index === 0) prefix = "🥇";
        else if (index === 1) prefix = "🥈";
        else if (index === 2) prefix = "🥉";

        li.innerHTML = `<span>${prefix} ${p.name}</span> <span>${p.score} pts</span>`;
        finalLeaderboardList.appendChild(li);
    });

    if (players.length > 0) {
        winnerNameSpan.textContent = players[0].name;
        winnerScoreSpan.textContent = players[0].score;
        triggerConfetti(players[0].name === myName);
    }
});

restartBtn.addEventListener("click", () => {
    socket.emit('returnToLobby');
});

// Efeito de Confetti
function triggerConfetti(isWinner) {
    if (typeof confetti === 'function') {
        if (isWinner) {
            var duration = 3000;
            var end = Date.now() + duration;

            (function frame() {
                confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#10b981', '#06b6d4', '#f8fafc'] });
                confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#10b981', '#06b6d4', '#f8fafc'] });

                if (Date.now() < end) requestAnimationFrame(frame);
            }());
        } else {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#94a3b8', '#f8fafc'] });
        }
    }
}
