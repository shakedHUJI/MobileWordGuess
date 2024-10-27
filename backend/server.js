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
app.use(bodyParser.json()); // Add this line to parse JSON requests
app.use(express.static(path.join(__dirname, "public")));
let games = {};
let sessions = {};
let clientInfoMap = new Map(); // Map to store client information
// Add this dictionary near the top of your file, after the imports and initial setup
const botStylePrompts = {
  regular: `
    for instance - if the secret word is "bear" and the user guess is "dog" you may answer something like "while it is often fun and playfull to pet a dog, i wouldn't recommend petting my secret, unless you're feeling you wouldn't need your hand anymore!"
    Keep your tone light, breezy, and fun. You can use humor and slang in moderation.
  `,
  emo: `
    your going to play an emo melancholic bot in your response.
    for instance - if the secret word is "bear" and the user guess is "dog" you may answer something like "petting a dog is so fun and cheery, I would much rather pet my secret, it seems like a brutal way to go."
  `,
  rizz: `
    your going to play a rizz flirty charismatic and very horny and sexual bot in your response.
    for instance - if the secret word is "bear" and the user guess is "banana" you may answer something like "while I would love  to stick my banana in you, I wouldn't recommend doing it with my secret, unless you're feeling too horny to care."
  `,
};
// Function to load and select a random word from words.json
function loadRandomWord() {
  try {
    const filePath = path.join(__dirname, "words.json");
    console.log("Attempting to read words from:", filePath);
    const data = fs.readFileSync(filePath, "utf8");
    console.log("File read successfully");
    const words = JSON.parse(data);
    console.log("JSON parsed successfully");
    const nouns = words.nouns;
    console.log("Number of words available:", nouns.length);
    const randomIndex = Math.floor(Math.random() * nouns.length);
    const selectedWord = nouns[randomIndex];
    console.log("Random word selected:", selectedWord);
    return selectedWord;
  } catch (error) {
    console.error("Error in loadRandomWord function:", error);
    console.error("Error stack:", error.stack);
    throw error; // Re-throw the error to be caught in the /replace-word route
  }
}
// Route to handle form submission for single-player and multiplayer modes
app.post("/generate", async (req, res) => {
  const {
    gameId,
    playerName,
    userGuess,
    mode,
    sessionId,
    generateNewWord,
    botStyle,
  } = req.body;
  if (mode === "single") {
    if (generateNewWord) {
      sessions[sessionId] = {
        secretWord: loadRandomWord(),

        revealedCharacters: [],

        botStyle: botStyle, // Store the bot style
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

      botStyle: "regular", // Default to regular if not set
    };
  }

  const secretWord = sessions[sessionId].secretWord;

  const botStyle = sessions[sessionId].botStyle;

  console.log(
    `Guess received for session ${sessionId}. Bot style: ${botStyle}`
  );

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

  generateResponse(userGuess, secretWord, res, null, null, sessionId);
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
  playerName = null,
  sessionId = null
) {
  console.log("Secret word on generateResponse:", secretWord);
  let botStyle = "regular"; // Default bot style
  if (sessionId && sessions[sessionId]) {
    botStyle = sessions[sessionId].botStyle;
  } else if (gameId && games[gameId]) {
    botStyle = games[gameId].botStyle;
  }
  console.log(`Generating response for bot style: ${botStyle}`);
  const botPrompt = botStylePrompts[botStyle] || botStylePrompts.regular;
  const prompt = `
    We're going to play a simple game.
    We have two words:
    User's guess - ${userGuess}
    Secret word - ${secretWord[0]}
    Write the connection you find between the words in one sentence.
    Do not use the secret word directly, but you are encouraged to use the user's guess directly.
    Don't be too obvious or specific in your answer. Don't use the secret word's emoji. Don't use very related words to the secret word explicitly (aka - if the secret word is "lamp" don't use "bulb")
    ${botPrompt}
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

// Add this new route with expanded logging

app.post("/replace-word", (req, res) => {
  console.log("Received request to replace word");
  console.log("Request body:", req.body);
  const { sessionId, mode } = req.body;
  console.log("Session ID received:", sessionId);
  console.log("Mode received:", mode);
  console.log("All current sessions:", Object.keys(sessions));
  if (mode !== "single") {
    console.log("Invalid mode. Expected 'single', received:", mode);
    return res.status(400).json({ success: false, message: "Invalid mode" });
  }
  if (!sessionId || !sessions[sessionId]) {
    console.log(
      "Invalid session ID. Sessions available:",
      Object.keys(sessions)
    );
    return res
      .status(400)
      .json({ success: false, message: "Invalid session ID" });
  }
  try {
    console.log(
      "Current secret word for session:",
      sessions[sessionId].secretWord
    );
    const newWord = loadRandomWord();
    console.log("New word generated:", newWord);
    sessions[sessionId].secretWord = newWord;
    console.log(`New secret word set for session ${sessionId}: ${newWord}`);
    res.json({ success: true, message: "Word replaced successfully" });
    console.log("Response sent: Word replaced successfully");
  } catch (error) {
    console.error("Error replacing word:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to replace word",
      error: error.message,
    });
    console.log("Response sent: Failed to replace word");
  }
});
app.post("/reveal-word-length", (req, res) => {
  console.log("Received request to reveal word length");
  console.log("Request body:", req.body);
  const { sessionId, mode } = req.body;
  console.log("Session ID received:", sessionId);
  console.log("Mode received:", mode);
  console.log("All current sessions:", Object.keys(sessions));
  if (mode !== "single") {
    console.log("Invalid mode. Expected 'single', received:", mode);
    return res.status(400).json({ success: false, message: "Invalid mode" });
  }
  if (!sessionId || !sessions[sessionId]) {
    console.log(
      "Invalid session ID. Sessions available:",
      Object.keys(sessions)
    );
    return res
      .status(400)
      .json({ success: false, message: "Invalid session ID" });
  }
  try {
    const secretWord = sessions[sessionId].secretWord;
    const wordLength = secretWord[0].length;
    console.log(`Word length for session ${sessionId}: ${wordLength}`);
    res.json({ success: true, wordLength: wordLength });
    console.log("Response sent: Word length revealed successfully");
  } catch (error) {
    console.error("Error revealing word length:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to reveal word length",
      error: error.message,
    });
    console.log("Response sent: Failed to reveal word length");
  }
});
app.post("/reveal-character", (req, res) => {
  console.log("Received request to reveal character");
  console.log("Request body:", req.body);
  const { sessionId, mode } = req.body;
  console.log("Session ID received:", sessionId);
  console.log("Mode received:", mode);
  console.log("All current sessions:", Object.keys(sessions));
  if (mode !== "single") {
    console.log('Invalid mode. Expected "single", received:', mode);
    return res.status(400).json({ success: false, message: "Invalid mode" });
  }
  if (!sessionId || !sessions[sessionId]) {
    console.log(
      "Invalid session ID. Sessions available:",
      Object.keys(sessions)
    );
    return res
      .status(400)
      .json({ success: false, message: "Invalid session ID" });
  }
  try {
    const session = sessions[sessionId];
    const secretWord = session.secretWord[0]; // Assuming secretWord is an array with one string
    // If revealedCharacters doesn't exist, initialize it
    if (!session.revealedCharacters) {
      session.revealedCharacters = [];
    }
    // Get indices of unrevealed characters
    const unrevealedIndices = secretWord
      .split("")
      .reduce((acc, char, index) => {
        if (!session.revealedCharacters.includes(index)) {
          acc.push(index);
        }
        return acc;
      }, []);
    if (unrevealedIndices.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "All characters have been revealed" });
    }
    // Randomly select an unrevealed character
    const randomIndex =
      unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
    const revealedCharacter = secretWord[randomIndex];
    // Update the session
    session.revealedCharacters.push(randomIndex);
    console.log(
      `Revealed character "${revealedCharacter}" at index ${randomIndex} for session ${sessionId}`
    );
    res.json({
      success: true,
      index: randomIndex,
      character: revealedCharacter,
    });
  } catch (error) {
    console.error("Error revealing character:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to reveal character",
      error: error.message,
    });
  }
});

let wordChangeVotes = {}; // To store votes for word changes

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
          currentTurn: null,
          host: data.playerName,
          botStyle: data.botStyle || "regular", // Add botStyle to game state
        };
        clientInfoMap.set(ws, { gameId, playerName: data.playerName });
        console.log(`Game created: ${gameId} by player: ${data.playerName}`);
        logGames();
        ws.send(
          JSON.stringify({
            action: "game_created",
            gameId,
            playerName: data.playerName,
            startingPlayer: data.playerName,
          })
        );
      } else if (data.action === "join_game") {
        const { gameId, playerName } = data;
        console.log(`Player ${playerName} attempting to join game ${gameId}`);
        logGames();
        if (games[gameId]) {
          // Check if the player name already exists in the game
          if (
            games[gameId].players.some((player) => player.name === playerName)
          ) {
            ws.send(
              JSON.stringify({
                action: "join_game_response",
                success: false,
                message: "Player name already taken",
              })
            );
          } else if (games[gameId].players.length < 10) {
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
                message: "Game is full (max 10 players)",
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
      } else if (data.action === "request_word_change") {
        const { gameId, playerName } = data;
        const game = games[gameId];

        if (game) {
          // Initialize voting session
          wordChangeVotes[gameId] = {
            requester: playerName,
            votes: {},
            totalPlayers: game.players.length,
          };

          // Broadcast the request to all players
          broadcastGameState(gameId, {
            action: "word_change_requested",
            requester: playerName,
          });
        }
      } else if (data.action === "word_change_vote") {
        const { gameId, playerName, vote } = data;
        const game = games[gameId];

        if (game && wordChangeVotes[gameId]) {
          // Record the vote
          wordChangeVotes[gameId].votes[playerName] = vote;

          // Check if all players have voted
          const totalVotes = Object.keys(wordChangeVotes[gameId].votes).length;

          // If everyone except the requester has voted
          if (totalVotes >= wordChangeVotes[gameId].totalPlayers - 1) {
            // Count 'yes' votes
            const yesVotes = Object.values(
              wordChangeVotes[gameId].votes
            ).filter((v) => v === "yes").length;

            // If all players voted yes (unanimous)
            const votePassed =
              yesVotes === wordChangeVotes[gameId].totalPlayers - 1;

            if (votePassed) {
              // Generate new word
              const newWord = loadRandomWord();
              game.secretWord = newWord;

              // Broadcast the successful word change
              broadcastGameState(gameId, {
                action: "word_changed",
                message: "The secret word has been replaced!",
              });
            }

            // Clean up the votes
            delete wordChangeVotes[gameId];
          }
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
