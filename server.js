const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const questions = [
    {
        question: "O que significa a sigla ODS?",
        options: [
            "Objetivos de Distribuição Sustentável",
            "Organização de Desenvolvimento Social",
            "Objetivos de Desenvolvimento Sustentável",
            "Organização de Direitos Sociais"
        ],
        answer: 2
    },
    {
        question: "Qual é o foco principal do ODS 7?",
        options: [
            "Erradicação da pobreza",
            "Energia limpa e acessível",
            "Água potável e saneamento",
            "Educação de qualidade"
        ],
        answer: 1
    },
    {
        question: "Qual das seguintes fontes de energia é considerada limpa e renovável?",
        options: [
            "Carvão mineral",
            "Gás Natural",
            "Petróleo",
            "Energia Solar"
        ],
        answer: 3
    },
    {
        question: "Por que é importante investir em energia limpa e acessível?",
        options: [
            "Para reduzir a emissão de gases de efeito estufa",
            "Para aumentar o aquecimento global",
            "Para esgotar os recursos naturais",
            "Para tornar a energia mais cara"
        ],
        answer: 0
    },
    {
        question: "Até que ano a ONU estabeleceu a meta de garantir acesso universal a serviços de energia modernos?",
        options: [
            "2025",
            "2040",
            "2030",
            "2050"
        ],
        answer: 2
    },
    {
        question: "Qual é a principal fonte de energia consumida no mundo atualmente?",
        options: [
            "Energia Solar",
            "Energia Nuclear",
            "Combustíveis Fósseis",
            "Energia Eólica"
        ],
        answer: 2
    },
    {
        question: "O que é matriz energética?",
        options: [
            "A quantidade de energia consumida por uma pessoa",
            "O conjunto de fontes de energia utilizadas em uma região ou país",
            "O processo de gerar energia a partir do sol",
            "Uma forma de medir a poluição do ar"
        ],
        answer: 1
    },
    {
        question: "Qual país é o maior produtor de energia solar do mundo?",
        options: [
            "Brasil",
            "Estados Unidos",
            "China",
            "Alemanha"
        ],
        answer: 2
    },
    {
        question: "A energia eólica é gerada a partir de qual recurso natural?",
        options: [
            "Ventos",
            "Marés",
            "Luz do sol",
            "Calor interno da Terra"
        ],
        answer: 0
    },
    {
        question: "O que significa o termo 'eficiência energética'?",
        options: [
            "Produzir o máximo de energia possível",
            "Usar menos energia para realizar a mesma tarefa",
            "Desperdiçar energia de forma controlada",
            "Usar apenas energia solar em casa"
        ],
        answer: 1
    },
    {
        question: "Embora considerada renovável, qual é um dos principais impactos ambientais das grandes usinas hidrelétricas?",
        options: [
            "Emissão de material radioativo",
            "Alta emissão de fuligem no ar",
            "Alagamento de grandes áreas e deslocamento de comunidades",
            "Esgotamento da água potável"
        ],
        answer: 2
    },
    {
        question: "A energia gerada pelo calor interno da Terra é conhecida como:",
        options: [
            "Energia Geotérmica",
            "Energia de Biomassa",
            "Energia Maremotriz",
            "Energia Térmica"
        ],
        answer: 0
    },
    {
        question: "Qual é a função das baterias nos sistemas de energia solar e eólica?",
        options: [
            "Aumentar a força do vento e o brilho do sol",
            "Gerar energia automaticamente",
            "Limpar a energia antes do consumo",
            "Armazenar energia para momentos sem sol ou vento"
        ],
        answer: 3
    },
    {
        question: "A energia de biomassa pode ser gerada através de:",
        options: [
            "Painéis fotovoltaicos",
            "Resíduos orgânicos, agrícolas e florestais",
            "Urânio enriquecido",
            "Movimento das ondas do mar"
        ],
        answer: 1
    },
    {
        question: "Qual destas fontes de energia NÃO é renovável?",
        options: [
            "Energia Solar",
            "Energia Nuclear",
            "Energia Eólica",
            "Energia Hidrelétrica"
        ],
        answer: 1
    },
    {
        question: "Qual continente ainda enfrenta os maiores desafios em relação ao acesso à eletricidade?",
        options: [
            "África (especialmente a África Subsaariana)",
            "Europa",
            "América do Norte",
            "Oceania"
        ],
        answer: 0
    },
    {
        question: "Os 'Empregos Verdes' (Green Jobs) são:",
        options: [
            "Empregos exclusivos para agricultores",
            "Trabalhos que contribuem para preservar ou restaurar o meio ambiente",
            "Empregos em escritórios pintados de verde",
            "Qualquer emprego no setor industrial"
        ],
        answer: 1
    },
    {
        question: "Como os governos podem incentivar a transição para energias limpas?",
        options: [
            "Aumentando os impostos sobre a energia solar",
            "Proibindo o uso de eletricidade",
            "Criando incentivos, subsídios e políticas públicas favoráveis",
            "Fechando todas as fábricas"
        ],
        answer: 2
    },
    {
        question: "Qual é a relação entre energia limpa e saúde pública?",
        options: [
            "Nenhuma, a energia não afeta a saúde",
            "Energias limpas reduzem a poluição do ar, diminuindo doenças respiratórias",
            "Energia limpa causa mais doenças devido às radiações",
            "Energias limpas são exclusivas para hospitais"
        ],
        answer: 1
    },
    {
        question: "O que você, como cidadão, pode fazer no dia a dia para apoiar o ODS 7?",
        options: [
            "Deixar todas as luzes acesas para testar a rede",
            "Comprar apenas produtos importados de longe",
            "Desperdiçar água, pois não tem relação com energia",
            "Reduzir o consumo de energia, apagar luzes e optar por aparelhos eficientes"
        ],
        answer: 3
    }
];

let gameState = 'LOBBY'; // LOBBY, QUESTION, SHOW_ANSWER, LEADERBOARD
let players = {};
let currentQuestionIndex = 0;
let timer = null;
let timeout = null;
let timeLeft = 0;

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Player joins
    socket.on('join', (name) => {
        players[socket.id] = { id: socket.id, name: name || 'Anônimo', score: 0, answer: null };
        io.emit('updateLobby', Object.values(players));
        
        // If game is already running, send them the current state
        if (gameState === 'QUESTION') {
            socket.emit('newQuestion', getCurrentQuestionData());
        }
    });

    // Admin or any player starts the game
    socket.on('startGame', () => {
        if (gameState === 'LOBBY' || gameState === 'LEADERBOARD') {
            currentQuestionIndex = 0;
            for (let id in players) {
                players[id].score = 0;
            }
            sendQuestion();
        }
    });

    socket.on('returnToLobby', () => {
        if (gameState === 'LEADERBOARD') {
            resetGame();
            io.emit('goToLobby');
        }
    });

    socket.on('submitAnswer', (index) => {
        if (gameState === 'QUESTION' && players[socket.id] && players[socket.id].answer === null) {
            players[socket.id].answer = index;
            
            // Check if everyone has answered
            const activePlayers = Object.values(players);
            if (activePlayers.length > 0 && activePlayers.every(p => p.answer !== null)) {
                endQuestion();
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete players[socket.id];
        
        if (gameState === 'LOBBY') {
            io.emit('updateLobby', Object.values(players));
        }
        
        // Se não sobrar ninguém, volta pro lobby
        if (Object.keys(players).length === 0) {
            resetGame();
        } else if (gameState === 'QUESTION') {
            // Verifica se quem sobrou já respondeu
            const activePlayers = Object.values(players);
            if (activePlayers.length > 0 && activePlayers.every(p => p.answer !== null)) {
                endQuestion();
            }
        }
    });
});

function resetGame() {
    gameState = 'LOBBY';
    currentQuestionIndex = 0;
    if (timer) clearInterval(timer);
    if (timeout) clearTimeout(timeout);
    for (let id in players) {
        players[id].score = 0;
        players[id].answer = null;
    }
}

function getCurrentQuestionData() {
    const q = questions[currentQuestionIndex];
    return {
        question: q.question,
        options: q.options,
        questionNumber: currentQuestionIndex + 1,
        totalQuestions: questions.length,
        timeLeft: timeLeft
    };
}

function sendQuestion() {
    gameState = 'QUESTION';
    for (let id in players) {
        players[id].answer = null;
    }
    
    io.emit('newQuestion', getCurrentQuestionData());
    
    timeLeft = 15; // 15 seconds per question
    if (timer) clearInterval(timer);
    
    // Broadcast timer every second
    timer = setInterval(() => {
        timeLeft--;
        io.emit('timer', timeLeft);
        if (timeLeft <= 0) {
            endQuestion();
        }
    }, 1000);
}

function endQuestion() {
    if (timer) clearInterval(timer);
    gameState = 'SHOW_ANSWER';
    const q = questions[currentQuestionIndex];
    
    for (let id in players) {
        const p = players[id];
        if (p.answer === q.answer) {
            p.score += 10;
        }
    }
    
    const results = {
        correctAnswer: q.answer,
        players: Object.values(players).sort((a, b) => b.score - a.score)
    };
    
    io.emit('showAnswer', results);
    
    timeout = setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            sendQuestion();
        } else {
            gameState = 'LEADERBOARD';
            io.emit('gameOver', Object.values(players).sort((a,b) => b.score - a.score));
        }
    }, 5000); // Shows the answer and scoreboard for 5 seconds before next question
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
