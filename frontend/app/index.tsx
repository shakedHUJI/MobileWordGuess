import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import styles from './styles';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const [gameMode, setGameMode] = useState<'single' | 'multi' | null>(null);
  const [sessionId, setSessionId] = useState<string>(generateSessionId());
  const [gameId, setGameId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [guessCount, setGuessCount] = useState<number>(0);
  const [userGuess, setUserGuess] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [emoji, setEmoji] = useState<string>('');
  const [history, setHistory] = useState<
    { player?: string; guess: string; response: string }[]
  >([]);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false); // New state to track if the game is over
  const [currentPlayer, setCurrentPlayer] = useState<string>('');
  const [turnIndicator, setTurnIndicator] = useState<string>('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [isSideMenuVisible, setIsSideMenuVisible] = useState<boolean>(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState<boolean>(false);
  const [emojiBackground, setEmojiBackground] = useState<boolean>(false);

  const confettiRef = useRef<any>(null);

  const serverUrl = 'http://192.168.1.246:3000';

  function generateSessionId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  const handleGuessSubmission = async () => {
    if (!userGuess.trim()) return;

    setGuessCount(guessCount + 1);

    const postData: any = {
      userGuess: userGuess.trim(),
      mode: gameMode,
      sessionId: sessionId,
    };

    if (gameMode === 'multi') {
      postData.gameId = gameId.trim();
      postData.playerName = playerName.trim();

      try {
        await fetch(`${serverUrl}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(postData).toString(),
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to submit your guess.');
      }
    } else if (gameMode === 'single') {
      try {
        const response = await fetch(`${serverUrl}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(postData).toString(),
        });

        const data = await response.json();
        updateGameUI(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to submit your guess.');
      }
    }

    setUserGuess('');
  };

  const updateGameUI = (data: any) => {
    setHistory((prevHistory) => [
      ...prevHistory,
      {
        player: data.player,
        guess: data.yourGuess || userGuess,
        response: data.response,
      },
    ]);

    setResponse(data.response);
    setEmoji(data.emoji);

    if (data.response && data.response.includes('Congratulations!')) {
      setIsGameWon(true);
      setIsGameOver(true); // Mark game as over when it's won
      confettiRef.current && confettiRef.current.start();
    }
  };

  const joinGame = () => {
    if (!gameId.trim() || !playerName.trim()) {
      Alert.alert('Error', 'Please enter both Game ID and Player Name.');
      return;
    }

    setIsGameStarted(true);
    setFeedbackMessage('Waiting for partner...');

    const ws = new WebSocket(`${serverUrl.replace('http', 'ws')}`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ gameId: gameId.trim(), playerName: playerName.trim() }));
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleGameStateUpdate(data);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      Alert.alert('Error', 'WebSocket connection error.');
    };

    setSocket(ws);
  };

  const handleGameStateUpdate = (data: any) => {
    if (data.error) {
      setTurnIndicator(data.error);
    } else if (data.currentPlayer) {
      setCurrentPlayer(data.currentPlayer);
      if (data.currentPlayer === playerName.trim()) {
        setTurnIndicator("It's your turn! Enter your guess:");
        setIsSubmitDisabled(false);
      } else {
        setTurnIndicator(`It's ${data.currentPlayer}'s turn.`);
        setIsSubmitDisabled(true);
      }
      setFeedbackMessage('');
    }

    if (data.guess && data.response) {
      updateGameUI(data);
    }

    // Check for win or lose scenario
    if (data.response && data.response.includes('Congratulations!')) {
      if (data.currentPlayer !== playerName.trim()) {
        setIsGameWon(true); // This player won
        setIsGameOver(true); // Mark the game as over
      } else {
        setIsGameWon(false); // This player lost
        setIsGameOver(true); // Mark the game as over
        setResponse("You've lost!");
        setEmoji('😢'); // Display a sad emoji
      }
    }
  };

  const resetGameState = () => {
    setIsGameWon(false);
    setIsGameOver(false); 
    setResponse('');
    setUserGuess('');
    setGuessCount(0);
    setHistory([]);
    setSessionId(generateSessionId());
    setEmoji('');
    setIsSubmitDisabled(false);

    if (gameMode === 'single') {
      fetch(`${serverUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          mode: 'single',
          sessionId: sessionId,
          generateNewWord: 'true',
        }).toString(),
      }).catch(() => {
        Alert.alert('Error', 'Failed to reset the game.');
      });
    } else if (gameMode === 'multi') {
      setGameMode(null);
      setIsGameStarted(false);
      setGameId('');
      setPlayerName('');
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  };

  useEffect(() => {
    if (emoji) {
      setEmojiBackground(true);
    } else {
      setEmojiBackground(false);
    }
  }, [emoji]);

  return (
    <View style={styles.container}>
      {emojiBackground && (
        <View style={styles.emojiBackgroundContainer}>
          {Array.from({ length: Math.ceil(height / 50) }).map((_, rowIndex) => (
            <View key={rowIndex} style={styles.emojiRow}>
              {Array.from({ length: Math.ceil(width / 50) }).map((_, colIndex) => (
                <Text key={colIndex} style={styles.emojiBackgroundText}>
                  {emoji}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}

      <Text style={styles.mainHeader}>Word Guess</Text>

      {!gameMode && (
        <View style={styles.modeSelectionContainer}>
          <Text style={styles.heading}>Select Game Mode</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setGameMode('single');
                setIsGameStarted(true);
                setFeedbackMessage('');
              }}
            >
              <Text style={styles.buttonText}>Single Player</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setGameMode('multi')}
            >
              <Text style={styles.buttonText}>2-Player</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {gameMode === 'multi' && !isGameStarted && (
        <View style={styles.setupContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter Game ID"
            placeholderTextColor="#888"
            value={gameId}
            onChangeText={setGameId}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Your Name"
            placeholderTextColor="#888"
            value={playerName}
            onChangeText={setPlayerName}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={joinGame}>
              <Text style={styles.buttonText}>Join Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isGameStarted && (
        <View style={styles.gameContainer}>
          {feedbackMessage ? (
            <Text style={styles.feedbackMessage}>{feedbackMessage}</Text>
          ) : null}
          {isGameOver ? (
            isGameWon ? (
              <View style={styles.congratsContent}>
                <Text style={styles.celebrateEmoji}>{emoji || '🥳'}</Text>
                <Text style={styles.congratsMessage}>
                  Congratulations! You've guessed the secret word using {guessCount} guesses!
                </Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.button} onPress={resetGameState}>
                    <Text style={styles.buttonText}>Play Again</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.congratsContent}>
                <Text style={styles.celebrateEmoji}>{emoji || '😢'}</Text>
                <Text style={styles.congratsMessage}>
                  You've lost! Better luck next time.
                </Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.button} onPress={resetGameState}>
                    <Text style={styles.buttonText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          ) : (
            <View style={styles.gameContent}>
              {turnIndicator ? (
                <Text style={styles.turnIndicator}>{turnIndicator}</Text>
              ) : null}
              <TextInput
                style={styles.input}
                placeholder="Enter your guess"
                placeholderTextColor="#888"
                value={userGuess}
                onChangeText={setUserGuess}
                editable={!isSubmitDisabled}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, isSubmitDisabled && styles.buttonDisabled]}
                  onPress={handleGuessSubmission}
                  disabled={isSubmitDisabled}
                >
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.guessCounter}>Guesses: {guessCount}</Text>
              {response ? (
                <ScrollView style={styles.responseContainer}>
                  <Text style={styles.responseText}>
                    <Text style={styles.boldText}>Your Guess:</Text> {userGuess}
                  </Text>
                  <Text style={styles.responseText}>
                    <Text style={styles.boldText}>Response:</Text> {response}
                  </Text>
                </ScrollView>
              ) : null}
            </View>
          )}
        </View>
      )}

      {isGameStarted && (
        <View style={styles.historyButtonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setIsSideMenuVisible(!isSideMenuVisible)}
          >
            <Text style={styles.buttonText}>
              {isSideMenuVisible ? 'Hide Guess History' : 'Show Guess History'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isGameWon && (
        <ConfettiCannon
          count={200}
          origin={{ x: -10, y: 0 }}
          autoStart={true}
          fadeOut={true}
          ref={confettiRef}
        />
      )}

      <Modal
        animationType="slide"
        transparent={false}
        visible={isSideMenuVisible}
        onRequestClose={() => {
          setIsSideMenuVisible(false);
        }}
      >
        <View style={styles.sideMenuContent}>
          <Text style={styles.heading}>Guess History</Text>
          <FlatList
            data={history}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                <Text style={styles.historyText}>
                  <Text style={styles.boldText}>
                    {item.player ? `${item.player}'s` : 'Your'} Guess:
                  </Text>{' '}
                  {item.guess}
                </Text>
                <Text style={styles.historyText}>
                  <Text style={styles.boldText}>Response:</Text> {item.response}
                </Text>
              </View>
            )}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setIsSideMenuVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
