import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import styles from '../styles/styles';
import { useRouter } from 'expo-router';

export default function MultiPlayerSelection() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);

  const serverUrl = 'wss://mobilewordguess.onrender.com'; // Replace with your actual WebSocket server URL

  useEffect(() => {
    const connectWebSocket = () => {
      wsRef.current = new WebSocket(serverUrl);
    
      wsRef.current.onopen = () => {
        console.log('WebSocket connection established');
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.action === 'game_created') {
          router.push({
            pathname: '/game-lobby',
            params: { playerName: data.playerName, gameId: data.gameId, players: JSON.stringify([data.playerName]), isHost: 'true' }
          });
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed. Attempting to reconnect...');
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        Alert.alert('Error', 'Failed to connect to the game server.');
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const createGame = () => {
    if (playerName.trim()) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'create_game', playerName: playerName.trim() }));
      } else {
        Alert.alert('Error', 'Not connected to the game server. Please try again.');
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
          <TouchableOpacity
            style={styles.button}
            onPress={createGame}
          >
            <Text style={styles.buttonText}>Create Game</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push({
              pathname: '/join-multi-player-game',
              params: { playerName: playerName.trim() }
            })}
          >
            <Text style={styles.buttonText}>Join Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}