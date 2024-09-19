// GameLobby.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import styles from '../styles/styles';
import { useWebSocket } from './WebSocketProvider';

export default function GameLobby() {
  const router = useRouter();
  const {
    playerName,
    gameId,
    players: initialPlayers,
    isHost: initialIsHost,
  } = useLocalSearchParams<{
    playerName: string;
    gameId: string;
    players: string;
    isHost: string;
  }>();
  const [players, setPlayers] = useState<string[]>(
    JSON.parse(initialPlayers || '[]')
  );
  const [isHost, setIsHost] = useState(initialIsHost === 'true');
  const { ws } = useWebSocket();

  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'join_lobby', gameId, playerName }));

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.action === 'player_joined') {
          setPlayers(data.players);
        } else if (data.action === 'game_started') {
          router.push({
            pathname: '/multi-player-game',
            params: { gameId, playerName },
          });
        } else if (data.action === 'player_left') {
          setPlayers(data.players);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        Alert.alert('Error', 'Lost connection to the game server.');
      };
    }
  }, [ws]);

  const startGame = () => {
    if (isHost) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'start_game', gameId }));
      } else {
        Alert.alert(
          'Error',
          'Not connected to the game server. Please try again.'
        );
      }
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
          renderItem={({ item }) => (
            <Text style={styles.playerItem}>{item}</Text>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            (!isHost || players.length < 2) && styles.buttonDisabled,
          ]}
          onPress={startGame}
          disabled={!isHost || players.length < 2}
        >
          <Text style={styles.buttonText}>
            {isHost ? 'Start Game' : 'Waiting for host to start...'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
