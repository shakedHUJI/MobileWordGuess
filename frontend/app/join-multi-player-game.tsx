import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import styles from '../styles/styles';

const JoinMultiPlayerGame = () => {
  const router = useRouter();
  const { playerName } = useLocalSearchParams<{ playerName: string }>();
  const [gameId, setGameId] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [isJoining, setIsJoining] = useState(false);
  const serverUrl = 'wss://mobilewordguess.onrender.com'; // Replace with your actual WebSocket server URL

  useEffect(() => {
    const ws = new WebSocket(serverUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.action === 'join_game_response') {
        setIsJoining(false);
        if (data.success) {
          router.push({
            pathname: '/game-lobby',
            params: { playerName, gameId: data.gameId }
          });
        } else {
          Alert.alert('Error', data.message || 'Failed to join the game.');
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsJoining(false);
      Alert.alert('Error', 'Failed to connect to the game server.');
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleInputChange = (text: string, index: number) => {
    const newGameId = [...gameId];
    newGameId[index] = text.toUpperCase();
    setGameId(newGameId);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    if (gameId[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const joinGame = () => {
    const fullGameId = gameId.join('');
    if (fullGameId.length === 6) {
      setIsJoining(true);
      const ws = new WebSocket(serverUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ action: 'join_game', gameId: fullGameId, playerName }));
      };
    } else {
      Alert.alert('Error', 'Please enter a complete 6-character Game ID');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainHeader}>Join Game</Text>
      <Text style={styles.heading}>Enter Game ID</Text>
      <View style={localStyles.gameIdContainer}>
        {gameId.map((char, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={localStyles.input}
            value={char}
            onChangeText={(text) => handleInputChange(text, index)}
            maxLength={1}
            keyboardType="default"
            autoCapitalize="characters"
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace') {
                handleBackspace(index);
              }
            }}
          />
        ))}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isJoining && styles.buttonDisabled]} 
          onPress={joinGame} 
          disabled={isJoining}
        >
          <Text style={styles.buttonText}>{isJoining ? 'Joining...' : 'Join Game!'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  gameIdContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  input: {
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 24,
    marginHorizontal: 5,
  },
});

export default JoinMultiPlayerGame;
