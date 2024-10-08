import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import styles from '../styles/styles';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWebSocket } from './WebSocketProvider';

const { width, height } = Dimensions.get('window');

export default function MultiPlayerGame() {
  const router = useRouter();
  const { gameId, playerName, currentPlayer: initialCurrentPlayer } = useLocalSearchParams<{ gameId: string; playerName: string; currentPlayer: string }>();
  const [currentPlayer, setCurrentPlayer] = useState<string>(initialCurrentPlayer);
  const [turnIndicator, setTurnIndicator] = useState<string>(initialCurrentPlayer === playerName ? "It's your turn!" : `It's ${initialCurrentPlayer}'s turn.`);
  const [userGuess, setUserGuess] = useState<string>('');
  const [isSubmitDisabled, setIsSubmitDisabled] = useState<boolean>(initialCurrentPlayer !== playerName);
  const [response, setResponse] = useState<string>('');
  const [emoji, setEmoji] = useState<string>('');
  const [history, setHistory] = useState<
    { player?: string; guess: string; response: string }[]
  >([]);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [guessCount, setGuessCount] = useState<number>(0);
  const [isSideMenuVisible, setIsSideMenuVisible] = useState<boolean>(false);
  const [emojiBackground, setEmojiBackground] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showFirstGuessMessage, setShowFirstGuessMessage] = useState<boolean>(true);

  const confettiRef = useRef<any>(null);
  const { ws } = useWebSocket();

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleGameStateUpdate(data);
      };
    }
  }, [ws]);

  useEffect(() => {
    if (emoji) {
      setEmojiBackground(true);
    } else {
      setEmojiBackground(false);
    }
  }, [emoji]);

  const handleGameStateUpdate = (data: any) => {
    console.log('Received WebSocket message:', data); // Add logging

    if (data.action === 'game_update' || data.action === 'correct_guess') {
      setCurrentPlayer(data.currentPlayer);
      setTurnIndicator(data.currentPlayer === playerName ? "It's your turn!" : `It's ${data.currentPlayer}'s turn.`);
      setIsSubmitDisabled(data.currentPlayer !== playerName);
      updateGameUI(data);
    } else if (data.action === 'player_joined' && data.startingPlayer) {
      setCurrentPlayer(data.startingPlayer);
      setTurnIndicator(data.startingPlayer === playerName ? "It's your turn!" : `It's ${data.startingPlayer}'s turn.`);
      setIsSubmitDisabled(data.startingPlayer !== playerName);
    }
      else if (data.action === 'game_reset') {
      // Reset the game state
      setIsGameWon(false);
      setIsGameOver(false);
      setResponse('');
      setUserGuess('');
      setGuessCount(0);
      setHistory([]);
      setEmoji('');
      setIsSubmitDisabled(data.currentPlayer !== playerName);
      setTurnIndicator(data.currentPlayer === playerName ? "It's your turn!" : `It's ${data.currentPlayer}'s turn.`);
    }
    else if (data.action === 'return_to_lobby') {
      // Determine if current player is host
      const isHost = data.host === playerName;
      // Navigate back to game lobby
      router.push({
        pathname: '/game-lobby',
        params: {
          gameId,
          playerName,
          players: JSON.stringify(data.players),
          isHost: isHost.toString(),
        },
      });
    }
  };

  const updateGameUI = (data: any) => {
    setHistory((prevHistory) => [
      ...prevHistory,
      {
        player: data.player,
        guess: data.guess,
        response: data.response,
      },
    ]);

    setResponse(data.response);
    setGuessCount((prevCount) => prevCount + 1);
    setUserGuess('');
    setShowFirstGuessMessage(false); // Hide the message after the first guess

    if (data.action === 'correct_guess') {
      setIsGameOver(true);
      if (data.player === playerName) {
        setIsGameWon(true);
        setEmoji(data.winnerEmoji);
        confettiRef.current && confettiRef.current.start();
      } else {
        setIsGameWon(false);
        setEmoji(data.loserEmoji);
      }
    } else {
      setEmoji(data.emoji);
    }
    setIsLoading(false);
  };

  const handleGuessSubmission = () => {
    if (!userGuess.trim()) return;

    setIsLoading(true);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        action: 'submit_guess',
        gameId,
        playerName,
        userGuess: userGuess.trim(),
      }));
    } else {
      setIsLoading(false);
      Alert.alert('Error', 'WebSocket connection is not open.');
    }
  };

  const resetGameState = () => {
    // Reset local game state variables
    setIsGameWon(false);
    setIsGameOver(false);
    setResponse('');
    setUserGuess('');
    setGuessCount(0);
    setHistory([]);
    setEmoji('');
    setIsSubmitDisabled(false);
    setEmojiBackground(false);
    setShowFirstGuessMessage(true);
    // Send 'play_again' action to the server
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        action: 'play_again',
        gameId,
        playerName,
      }));
    } else {
      Alert.alert('Error', 'WebSocket connection is not open.');
      router.push('/');
    }
  };
  
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

      <View style={styles.gameContainer}>
        {isGameOver ? (
          isGameWon ? (
            <View style={styles.congratsContent}>
              <Text style={styles.celebrateEmoji}>{emoji}</Text>
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
              <Text style={styles.celebrateEmoji}>{emoji}</Text>
              <Text style={styles.congratsMessage}>
                Game Over! {history[history.length - 1].player} guessed the word.
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
            {showFirstGuessMessage && (
              <Text style={styles.firstGuessMessage}>Be the first to guess!</Text>
            )}
            <TextInput
              style={styles.input}
              placeholder="Enter your guess"
              placeholderTextColor="#888"
              value={userGuess}
              onChangeText={setUserGuess}
              editable={!isSubmitDisabled && !isLoading}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, (isSubmitDisabled || isLoading) && styles.buttonDisabled]}
                onPress={handleGuessSubmission}
                disabled={isSubmitDisabled || isLoading}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.guessCounter}>Guesses: {guessCount}</Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size={70} color="#40798C" />
                <Text style={styles.loadingText}>Processing your guess...</Text>
                </View>
            ) : response && history.length > 0 ? (
              <ScrollView style={styles.responseContainer}>
                <Text style={styles.responseText}>
                  <Text style={styles.boldText}>{history[history.length - 1].player}'s Guess:</Text> {history[history.length - 1].guess}
                </Text>
                <Text style={styles.responseText}>
                  <Text style={styles.boldText}>Response:</Text> {response}
                </Text>
              </ScrollView>
            ) : null}
          </View>
        )}
      </View>

      {!isGameOver && (
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
