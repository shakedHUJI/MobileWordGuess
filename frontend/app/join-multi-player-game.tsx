// JoinMultiPlayerGame.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import styles from '../styles/styles';
import { useWebSocket } from './WebSocketProvider';

const JoinMultiPlayerGame = () => {
  const router = useRouter();
  const { playerName } = useLocalSearchParams<{ playerName: string }>();
  const [gameId, setGameId] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [isJoining, setIsJoining] = useState(false);
  const { ws } = useWebSocket();

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        if (data.action === 'join_game_response') {
          setIsJoining(false);
          if (data.success) {
            router.push({
              pathname: '/game-lobby',
              params: {
                playerName,
                gameId: data.gameId,
                players: JSON.stringify(data.players),
                isHost: data.isHost.toString(),
              },
            });
          } else {
            // Alert.alert('Error', data.message || 'Failed to join the game.');
          }
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsJoining(false);
        Alert.alert('Error', 'Failed to connect to the game server.');
      };
    }
  }, [ws]);

  const handleInputChange = (text: string, index: number) => {
    const newGameId = [...gameId];
    const uppercaseText = text.toUpperCase();
    
    // Handle pasting
    if (uppercaseText.length > 1) {
      const pastedChars = uppercaseText.split('').slice(0, 6);
      for (let i = 0; i < pastedChars.length; i++) {
        if (index + i < 6) {
          newGameId[index + i] = pastedChars[i];
        }
      }
      setGameId(newGameId);
      // Focus on the last filled input or the last input
      const lastFilledIndex = Math.min(index + pastedChars.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
      
      // If all 6 characters are filled, join the game
      if (newGameId.every(char => char !== '')) {
        joinGame(newGameId.join(''));
      }
    } else {
      // Handle single character input
      newGameId[index] = uppercaseText;
      setGameId(newGameId);
      if (uppercaseText && index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else if (index === 5 && uppercaseText) {
        // If the 6th character is entered, join the game
        joinGame(newGameId.join(''));
      }
    }
  };

  const handleBackspace = (index: number) => {
    if (gameId[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const joinGame = (fullGameId: string) => {
    if (
      fullGameId.length === 6 &&
      ws &&
      ws.readyState === WebSocket.OPEN &&
      !isJoining
    ) {
      setIsJoining(true);
      ws.send(
        JSON.stringify({
          action: 'join_game',
          gameId: fullGameId,
          playerName,
        })
      );
    } else if (fullGameId.length !== 6) {
      Alert.alert('Error', 'Please enter a complete 6-character Game ID');
    } else if (isJoining) {
      // Do nothing if already joining
    } else {
      Alert.alert(
        'Error',
        'WebSocket is not connected. Please try again.'
      );
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
            maxLength={6} // Allow pasting up to 6 characters
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
          onPress={() => joinGame(gameId.join(''))}
          disabled={isJoining}
        >
          <Text style={styles.buttonText}>
            {isJoining ? 'Joining...' : 'Join Game'}
          </Text>
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
