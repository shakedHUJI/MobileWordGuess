// MultiPlayerSelection.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import styles from '../styles/styles';
import { useRouter } from 'expo-router';
import { useWebSocket } from './WebSocketProvider';

export default function MultiPlayerSelection() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState<string>('');
  const { ws, isConnected } = useWebSocket();

  useEffect(() => {
    if (isConnected && ws) {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.action === 'game_created') {
          router.push({
            pathname: '/game-lobby',
            params: {
              playerName: data.playerName,
              gameId: data.gameId,
              players: JSON.stringify([data.playerName]),
              isHost: 'true',
            },
          });
        }
      };
    }
  }, [isConnected, ws]);

  const createGame = () => {
    if (playerName.trim()) {
      if (isConnected && ws) {
        ws.send(
          JSON.stringify({
            action: 'create_game',
            playerName: playerName.trim(),
          })
        );
      } else {
        Alert.alert(
          'Error',
          'Not connected to the game server. Please try again.'
        );
      }
    } else {
      Alert.alert('Error', 'Please enter your name');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainHeader}>2-Player Mode</Text>
      <View style={styles.modeSelectionContainer}>
        <Text style={styles.heading}>Select Option</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Your Name"
          placeholderTextColor="#888"
          value={playerName}
          onChangeText={setPlayerName}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={createGame}>
            <Text style={styles.buttonText}>Create Game</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              router.push({
                pathname: '/join-multi-player-game',
                params: { playerName: playerName.trim() },
              })
            }
          >
            <Text style={styles.buttonText}>Join Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
