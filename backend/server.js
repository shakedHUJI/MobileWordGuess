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
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

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
let clientInfoMap = new Map(); // Map to store client information

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

  if (
    secretWord.some((word) => word.toLowerCase() === userGuess.toLowerCase())
  ) {
    return res.json({
      yourGuess: userGuess,
      response: "Congratulations! You've guessed the secret word!",
      emoji: "🥳",
    });
  }

  generateResponse(userGuess, secretWord, res);
}

// Function to handle multiplayer guesses
function handleMultiPlayerGuess(gameId, playerName, userGuess, ws) {
  const game = games[gameId];

  if (!game) {
    ws.send(JSON.stringify({ error: "Game not found" }));
    return;
  }

  const currentTurn = game.currentTurn;
  const currentPlayer = game.players[currentTurn];

  if (currentPlayer.name !== playerName) {
    ws.send(JSON.stringify({ error: "Not your turn" }));
    return;
  }

  const secretWord = game.secretWord;

  if (
    secretWord.some((word) => word.toLowerCase() === userGuess.toLowerCase())
  ) {
    game.secretWord = loadRandomWord(); // Generate a new word
    game.currentTurn = (game.currentTurn + 1) % game.players.length; // Switch turn
    broadcastGameState(gameId, {
      action: "correct_guess",
      player: playerName,
      guess: userGuess,
      response: "Congratulations! You've guessed the secret word!",
      winnerEmoji: "🥳",
      loserEmoji: "🫠",
      currentPlayer: game.players[game.currentTurn].name, // Notify whose turn is next
    });
  } else {
    generateResponse(userGuess, secretWord, null, gameId, playerName);
  }
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
    User's guess - ${userGuess}
    Secret word - ${secretWord[0]}
    Write the connection you find between the words in one sentence.
    Do not use the secret word directly, but you are encouraged to use the user's guess directly.
    Don't be too obvious or specific in your answer. Don't use the secret word's emoji. Don't use very related words to the secret word explicitly (aka - if the secret word is "lamp" don't use "bulb")
    for instance - if the secret word is "bear" and the user guess is "dog" you may answer something like "while it is often fun and playfull to pet a dog, i wouldn't recommend petting my secret, unless you're feeling you wouldn't need your hand anymore!"
    Keep your tone light, breezy, and fun. You can use humor and slang in moderation.
  `;

  const promptEmoji = `Respond only with the best fitting emoji for the word "${userGuess}" without any additional text.`;

  try {
    // Execute both API requests in parallel using Promise.all
    const [completion, emojiCompletion] = await Promise.all([
      openai.createChatCompletion({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: prompt }],
      }),
      openai.createChatCompletion({
        model: "gpt-4o-mini",
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
      game.currentTurn = (game.currentTurn + 1) % game.players.length; // Switch turn
      broadcastGameState(gameId, {
        action: "game_update",
        player: playerName,
        guess: userGuess,
        response: responseData.response,
        emoji: responseData.emoji,
        currentPlayer: game.players[game.currentTurn].name, // Notify whose turn is next
      });
    } else if (res) {
      res.json(responseData);
    }
  } catch (error) {
    console.error("Error:", error);
    if (res) {
      res.json({
        yourGuess: userGuess,
        response: "Failed to generate a response.",
        emoji: "",
      });
    }
  }
}

// Function to broadcast game state to all players in a multiplayer game
function broadcastGameState(gameId, data) {
  const game = games[gameId];
  wss.clients.forEach((client) => {
    const clientInfo = clientInfoMap.get(client);
    if (
      client.readyState === WebSocket.OPEN &&
      clientInfo &&
      clientInfo.gameId === gameId
    ) {
      client.send(JSON.stringify(data));
    }
  });
}

// Function to generate a unique game ID
function generateUniqueGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Function to log current games
function logGames() {
  console.log("Current games:", JSON.stringify(Object.keys(games)));
  Object.entries(games).forEach(([gameId, game]) => {
    console.log(
      `Game ${gameId}:`,
      JSON.stringify({
        players: game.players.map((p) => p.name),
        secretWord: game.secretWord,
        currentTurn: game.currentTurn,
      })
    );
  });
}

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("New WebSocket connection established");

  ws.on("message", (message) => {
    console.log("Received WebSocket message:", message.toString());

    try {
      const data = JSON.parse(message);
      console.log("Parsed message data:", JSON.stringify(data));

      if (data.action === "create_game") {
        const gameId = generateUniqueGameId();
        games[gameId] = {
          players: [{ name: data.playerName, ws }],
          secretWord: loadRandomWord(),
          currentTurn: null, // Remove the initial turn selection
          host: data.playerName, // Add host property
        };
        clientInfoMap.set(ws, { gameId, playerName: data.playerName });
        console.log(`Game created: ${gameId} by player: ${data.playerName}`);
        logGames();

        ws.send(
          JSON.stringify({
            action: "game_created",
            gameId,
            playerName: data.playerName,
            startingPlayer: data.playerName, // Send the starting player name
          })
        );
      } else if (data.action === "join_game") {
        const { gameId, playerName } = data;
        console.log(`Player ${playerName} attempting to join game ${gameId}`);
        logGames();

        if (games[gameId]) {
          if (games[gameId].players.length < 2) {
            games[gameId].players.push({ name: playerName, ws });
            clientInfoMap.set(ws, { gameId, playerName });
            console.log(`Player ${playerName} joined game ${gameId}`);
            logGames();

            ws.send(
              JSON.stringify({
                action: "join_game_response",
                success: true,
                gameId,
                playerName,
                players: games[gameId].players.map((p) => p.name),
                isHost: games[gameId].host === playerName, // Correct host assignment,
                startingPlayer:
                  games[gameId].players[games[gameId].currentTurn]?.name ||
                  null, // Send the starting player name if available
              })
            );
            broadcastGameState(gameId, {
              action: "player_joined",
              players: games[gameId].players.map((p) => p.name),
              startingPlayer:
                games[gameId].players[games[gameId].currentTurn]?.name || null, // Broadcast the starting player name if available
            });
          } else {
            ws.send(
              JSON.stringify({
                action: "join_game_response",
                success: false,
                message: "Game is full",
              })
            );
            console.log(
              `Game ${gameId} is full, player ${playerName} cannot join`
            );
          }
        } else {
          console.log(`Game ${gameId} not found.`);
          logGames();
          ws.send(
            JSON.stringify({
              action: "join_game_response",
              success: false,
              message: "Game not found",
            })
          );
        }
      } else if (data.action === "join_lobby") {
        const { gameId, playerName } = data;
        console.log(`Player ${playerName} joining lobby for game ${gameId}`);
        if (games[gameId]) {
          clientInfoMap.set(ws, { gameId, playerName });
          broadcastGameState(gameId, {
            action: "player_joined",
            players: games[gameId].players.map((p) => p.name),
            startingPlayer:
              games[gameId].players[games[gameId].currentTurn]?.name || null, // Broadcast the starting player name if available
          });
        }
        logGames();
      } else if (data.action === "start_game") {
        const { gameId } = data;
        console.log(`Starting game ${gameId}`);
        if (games[gameId]) {
          // Randomly select the current player
          const randomIndex = Math.floor(
            Math.random() * games[gameId].players.length
          );
          games[gameId].currentTurn = randomIndex;

          broadcastGameState(gameId, {
            action: "game_started",
            currentPlayer: games[gameId].players[randomIndex].name,
          });
        }
      } else if (data.action === "submit_guess") {
        const { gameId, playerName, userGuess } = data;
        handleMultiPlayerGuess(gameId, playerName, userGuess, ws);
      }
      // Handle other actions as needed
      else if (data.action === "play_again") {
        const { gameId, playerName } = data;
        const game = games[gameId];
        if (game) {
          // Reset the game state to lobby
          game.secretWord = loadRandomWord();
          game.currentTurn = null; // Set currentTurn to null to indicate the game hasn't started
          // Broadcast to all players to return to lobby
          broadcastGameState(gameId, {
            action: "return_to_lobby",
            message: `${playerName} wants to play again.`,
            players: game.players.map((p) => p.name),
            host: game.host,
          });
        }
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    const clientInfo = clientInfoMap.get(ws);
    if (clientInfo) {
      const { gameId, playerName } = clientInfo;
      console.log(
        `WebSocket connection closed for player ${playerName} in game ${gameId}`
      );
      if (games[gameId]) {
        games[gameId].players = games[gameId].players.filter(
          (player) => player.ws !== ws
        );
        if (games[gameId].players.length === 0) {
          console.log(`No players left, deleting game ${gameId}`);
          delete games[gameId];
        } else {
          // Notify remaining players that a player has left
          broadcastGameState(gameId, {
            action: "player_left",
            players: games[gameId].players.map((p) => p.name),
          });
        }
        logGames();
      }
      // Remove the client from the clientInfoMap
      clientInfoMap.delete(ws);
    } else {
      console.log("WebSocket connection closed, but no client info found");
    }
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
