const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// CORS configuration
const allowedOrigins = [
  "http://localhost:8081",
  "https://your-production-url.com",
]; // Add your production URL here if needed

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin like mobile apps
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow credentials if needed
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

let games = {};
let sessions = {};

// Function to load and select a random word from words.json
function loadRandomWord() {
  const filePath = path.join(__dirname, "words.json");
  const data = fs.readFileSync(filePath, "utf8");
  const words = JSON.parse(data);
  const nouns = words.nouns;

  const randomIndex = Math.floor(Math.random() * nouns.length);
  return nouns[randomIndex];
}

// Route to handle form submission for single-player and multiplayer modes
app.post("/generate", async (req, res) => {
  const { gameId, playerName, userGuess, mode, sessionId, generateNewWord } =
    req.body;

  if (mode === "single") {
    if (generateNewWord) {
      sessions[sessionId] = {
        secretWord: loadRandomWord(),
      };
      res.json({ message: "New word generated." });
    } else {
      handleSinglePlayerGuess(sessionId, userGuess, res);
    }
  } else if (mode === "multi") {
    handleMultiPlayerGuess(gameId, playerName, userGuess, res);
  } else {
    res.status(400).json({ error: "Invalid mode" });
  }
});

// Function to handle single-player guesses
function handleSinglePlayerGuess(sessionId, userGuess, res) {
  if (!sessions[sessionId] || !sessions[sessionId].secretWord) {
    sessions[sessionId] = {
      secretWord: loadRandomWord(),
    };
  }

  const secretWord = sessions[sessionId].secretWord;

  console.log("Secret word for session:", sessionId, secretWord);

  if (userGuess.toLowerCase() === secretWord.toLowerCase()) {
    return res.json({
      yourGuess: userGuess,
      response: "Congratulations! You've guessed the secret word!",
      emoji: "🥳",
    });
  }

  generateResponse(userGuess, secretWord, res);
}

// Function to handle multiplayer guesses
function handleMultiPlayerGuess(gameId, playerName, userGuess, res) {
  const game = games[gameId];

  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  const currentTurn = game.currentTurn;
  const currentPlayer = game.players[currentTurn];

  if (currentPlayer.name !== playerName) {
    return res.status(403).json({ error: "Not your turn" });
  }

  const secretWord = game.secretWord;

  if (userGuess.toLowerCase() === secretWord.toLowerCase()) {
    game.secretWord = loadRandomWord(); // Generate a new word
    game.currentTurn = (game.currentTurn + 1) % 2; // Switch turn
    broadcastGameState(gameId, {
      player: playerName,
      guess: userGuess,
      response: "Congratulations! You've guessed the secret word!",
      emoji: "🥳",
      currentPlayer: game.players[game.currentTurn].name, // Notify whose turn is next
    });
    return res.json({ success: true });
  }

  generateResponse(userGuess, secretWord, res, gameId, playerName);
}

// Function to generate a response using the OpenAI API
async function generateResponse(
  userGuess,
  secretWord,
  res,
  gameId = null,
  playerName = null
) {
  console.log("Secret word on generateResponse:", secretWord);

  const prompt = `
    We're going to play a simple game.
    We have two words:
    User's guess - "${userGuess}"
    Secret word - "${secretWord}"
    Write the connection you find between the words in one sentence.
    Do not use the secret word directly, but you are encouraged to use the user's guess directly.
    Don't be too obvious or specific in your answer. Don't use the secret word's emoji.
    
    Keep your tone light, breezy, and fun. You can use humor and slang in moderation.
    Finish it off by giving the two words a 'connection score' from 1 to 10.
  `;

  const promptEmoji = `Respond only with the best fitting emoji for the word "${userGuess}" without any additional text.`;

  try {
    // Execute both API requests in parallel using Promise.all
    const [completion, emojiCompletion] = await Promise.all([
      openai.createChatCompletion({
        model: "gpt-4",
        messages: [{ role: "system", content: prompt }],
      }),
      openai.createChatCompletion({
        model: "gpt-4",
        messages: [{ role: "system", content: promptEmoji }],
      }),
    ]);

    const responseData = {
      yourGuess: userGuess,
      response: completion.data.choices[0].message.content.trim(),
      emoji: emojiCompletion.data.choices[0].message.content.trim(),
    };

    if (gameId && playerName) {
      const game = games[gameId];
      game.currentTurn = (game.currentTurn + 1) % 2; // Switch turn
      broadcastGameState(gameId, {
        player: playerName,
        guess: userGuess,
        response: responseData.response,
        emoji: responseData.emoji,
        currentPlayer: game.players[game.currentTurn].name, // Notify whose turn is next
      });
      res.json({ success: true });
    } else {
      res.json(responseData);
    }
  } catch (error) {
    console.error("Error:", error);
    res.json({
      yourGuess: userGuess,
      response: "Failed to generate a response.",
      emoji: "",
    });
  }
}

// Function to broadcast game state to all players in a multiplayer game
function broadcastGameState(gameId, data) {
  const game = games[gameId];
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.gameId === gameId) {
      client.send(JSON.stringify(data));
    }
  });
}

// Add this function to generate a unique game ID
function generateUniqueGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Modify the WebSocket connection handler
wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    
    if (data.action === "create_game") {
      const gameId = generateUniqueGameId();
      games[gameId] = {
        players: [{ name: data.playerName, ws }],
        secretWord: loadRandomWord(),
        currentTurn: 0,
      };
      ws.gameId = gameId;
      ws.send(JSON.stringify({ action: "game_created", gameId, playerName: data.playerName }));
    } else if (data.action === "join_game") {
      // ... (existing join game logic)
    }
  });

  ws.on("close", () => {
    const gameId = ws.gameId;
    if (games[gameId]) {
      games[gameId].players = games[gameId].players.filter(
        (player) => player.ws !== ws
      );
      if (games[gameId].players.length === 0) {
        delete games[gameId]; // Delete the game if no players are left
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
