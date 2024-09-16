// server.js
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

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

let games = {};
let sessions = {}; // Store session-specific data

// Function to load and select a random word from words.json
// TODO: Make this more efficient by not reading the file every time
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
    // Send the winning response without HTML
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

  const prompt = `We're going to play a simple game.
We have two words:
Users guess - "${userGuess}"
Secret word - "${secretWord}"
Write the connection you find between the words in one sentence.
Do not use the secret word directly, but you are encouraged to use the user's guess directly.
Don't be too obvious or specific in your answer. Don't use the secret word's emoji.

For example, if "users guess" was "sky" and the secret word was "penguin" a good response would be:
"Some kind of the secret word can be found in the sky."
Note that "sky" is the user's guess, thus we're allowed to use it, while penguin is the secret word, so we do not use it.

Keep your tone light, breezy and fun. You can use humor and slang in moderation.
Use common words rather than higher language.
Finish it off by giving the two words a 'connection score' from 1 to 10. This score represents a *direct* connection between the two words.
For example, for 'fire' and 'bonfire' you can finish it off with: 'connection score: 9.', while for 'brick' and 'plant' you might write: 'connection score: 1.'.
Write the connection score on a new line.

Respond only with plain text without any HTML tags.`;

  const promptEmoji = `Respond only with the best fitting emoji for the word "${userGuess}" without any additional text.`;

  try {
    // TODO: consider combining the await calls with Promise.all
    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
    });

    const emojiCompletion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: promptEmoji }],
    });

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

// WebSocket setup for multiplayer
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const { gameId, playerName } = JSON.parse(message);
    ws.gameId = gameId;
    const game = games[gameId];

    if (!game) {
      games[gameId] = {
        players: [{ name: playerName, ws }],
        secretWord: loadRandomWord(),
        currentTurn: 0,
      };
    } else if (game.players.length < 2) {
      game.players.push({ name: playerName, ws });

      // Notify both players that the game can start and whose turn it is
      broadcastGameState(gameId, {
        message: "Both players have joined. Let's start the game!",
        currentPlayer: game.players[game.currentTurn].name,
      });
    } else {
      ws.send(JSON.stringify({ error: "Game is full" }));
    }
  });

  ws.on("close", () => {
    // Handle player disconnect, if necessary
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
