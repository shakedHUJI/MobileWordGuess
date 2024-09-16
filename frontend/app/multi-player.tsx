// app/multi-player.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import styles from '../styles/styles';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function MultiPlayerGame() {
  const router = useRouter();
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>(generateSessionId());
  const [currentPlayer, setCurrentPlayer] = useState<string>('');
  const [turnIndicator, setTurnIndicator] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [userGuess, setUserGuess] = useState<string>('');
  const [isSubmitDisabled, setIsSubmitDisabled] = useState<boolean>(false);
  const [response, setResponse] = useState<string>('');
  const [emoji, setEmoji] = useState<string>('');
  const [history, setHistory] = useState<
    { player?: string; guess: string; response: string }[]
  >([]);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [guessCount, setGuessCount] = useState<number>(0);
  const [emojiBackground, setEmojiBackground] = useState<boolean>(false);
  const [isSideMenuVisible, setIsSideMenuVisible] = useState<boolean>(false);

  const confettiRef = useRef<any>(null);

  const serverUrl = 'https://mobilewordguess.onrender.com';

  function generateSessionId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  const joinGame = () => {
    if (!gameId.trim() || !playerName.trim()) {
      Alert.alert('Error', 'Please enter both Game ID and Player Name.');
      return;
    }

    setIsGameStarted(true);
    setFeedbackMessage('Waiting for partner...');

    const ws = new WebSocket(`${serverUrl.replace('https', 'wss')}`);

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

    if (data.response && data.response.includes('Congratulations!')) {
      if (data.currentPlayer === playerName.trim()) {
        setIsGameWon(true);
        setIsGameOver(true);
        confettiRef.current && confettiRef.current.start();
      } else {
        setIsGameWon(false);
        setIsGameOver(true);
        setResponse("You've lost!");
        setEmoji('😢');
      }
    }
  };

  const updateGameUI = (data: any) => {
    setHistory((prevHistory) => [
      ...prevHistory,
      {
        player: data.currentPlayer,
        guess: data.guess || userGuess,
        response: data.response,
      },
    ]);

    setResponse(data.response);
    setEmoji(data.emoji);
    setGuessCount(guessCount + 1);
    setUserGuess('');

    if (data.response && data.response.includes('Congratulations!')) {
      if (data.currentPlayer === playerName.trim()) {
        setIsGameWon(true);
        setIsGameOver(true);
        confettiRef.current && confettiRef.current.start();
      } else {
        setIsGameWon(false);
        setIsGameOver(true);
        setResponse("You've lost!");
        setEmoji('😢');
      }
    }
  };

  const handleGuessSubmission = async () => {
    if (!userGuess.trim()) return;

    if (socket && socket.readyState === WebSocket.OPEN) {
      const postData: any = {
        userGuess: userGuess.trim(),
        mode: 'multi',
        gameId: gameId.trim(),
        playerName: playerName.trim(),
        sessionId: sessionId,
      };

      socket.send(JSON.stringify(postData));
    } else {
      Alert.alert('Error', 'WebSocket connection is not open.');
    }
  };

  const resetGameState = () => {
    setIsGameWon(false);
    setIsGameOver(false);
    setResponse('');
    setUserGuess('');
    setGuessCount(0);
    setHistory([]);
    setEmoji('');
    setIsSubmitDisabled(false);
    setIsGameStarted(false);
    setGameId('');
    setPlayerName('');
    setFeedbackMessage('');
    setTurnIndicator('');
    setCurrentPlayer('');
    setEmojiBackground(false);

    if (socket) {
      socket.close();
      setSocket(null);
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

      {!isGameStarted ? (
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
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/')}
            >
              <Text style={styles.buttonText}>Back to Main Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.gameContainer}>
          {feedbackMessage ? (
            <Text style={styles.feedbackMessage}>{feedbackMessage}</Text>
          ) : null}
          {isGameOver ? (
            isGameWon ? (
              <View style={styles.congratsContent}>
                <Text style={styles.celebrateEmoji}>{emoji || '🥳'}</Text>
                <Text style={styles.congratsMessage}>
                  Congratulations! You've guessed the secret word!
                </Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.button} onPress={resetGameState}>
                    <Text style={styles.buttonText}>Play Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/')}
                  >
                    <Text style={styles.buttonText}>Back to Main Menu</Text>
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
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/')}
                  >
                    <Text style={styles.buttonText}>Back to Main Menu</Text>
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
