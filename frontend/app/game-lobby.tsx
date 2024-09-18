import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import styles from '../styles/styles';

export default function GameLobby() {
  const router = useRouter();
  const { playerName, gameId } = useLocalSearchParams<{ playerName: string, gameId: string }>();
  const [players, setPlayers] = useState<string[]>([playerName || 'Player 1']);
  const [isHost, setIsHost] = useState(false);

  const serverUrl = 'wss://mobilewordguess.onrender.com'; // Replace with your actual WebSocket server URL

  useEffect(() => {
    const ws = new WebSocket(serverUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.action === 'player_joined') {
        setPlayers(prevPlayers => [...prevPlayers, data.playerName]);
      } else if (data.action === 'game_start') {
        router.push('/multi-player-game');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      Alert.alert('Error', 'Lost connection to the game server.');
    };

    return () => {
      ws.close();
    };
  }, []);

  const startGame = () => {
    if (isHost) {
      const ws = new WebSocket(serverUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ action: 'start_game', gameId }));
      };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainHeader}>Game Lobby</Text>
      
      <View style={styles.gameIdContainer}>
        <Text style={styles.gameIdLabel}>Game ID:</Text>
        <Text style={styles.gameId}>{gameId}</Text>
      </View>

      <View style={styles.playersListContainer}>
        <Text style={styles.heading}>Players:</Text>
        <FlatList
          data={players}
          renderItem={({ item }) => <Text style={styles.playerItem}>{item}</Text>}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, (!isHost || players.length < 2) && styles.buttonDisabled]}
          onPress={startGame}
          disabled={!isHost || players.length < 2}
        >
          <Text style={styles.buttonText}>{isHost ? 'Start Game' : 'Waiting for host to start...'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
