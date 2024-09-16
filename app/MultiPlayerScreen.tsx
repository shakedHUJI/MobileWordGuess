import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import styles from './styles'; // Assume shared styles

export default function MultiPlayerScreen() {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [userGuess, setUserGuess] = useState('');
  const [response, setResponse] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [guessCount, setGuessCount] = useState(0);
  const [isGameWon, setIsGameWon] = useState(false);
  const confettiRef = useRef(null);

  const joinGame = () => {
    if (!gameId.trim() || !playerName.trim()) {
      Alert.alert('Error', 'Please enter both Game ID and Player Name.');
      return;
    }
    // Establish WebSocket connection for multiplayer mode
    // Handle game logic here...
  };

  const handleGuessSubmission = async () => {
    if (!userGuess.trim()) return;

    // Submit guess logic
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainHeader}>Multi-Player Mode</Text>
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

      {response && (
        <ScrollView style={styles.responseContainer}>
          <Text style={styles.responseText}>
            <Text style={styles.boldText}>Response:</Text> {response}
          </Text>
        </ScrollView>
      )}

      {isGameWon && (
        <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} fadeOut={true} ref={confettiRef} />
      )}
    </View>
  );
}
