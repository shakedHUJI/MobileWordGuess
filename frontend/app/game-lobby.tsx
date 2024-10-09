// GameLobby.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomButton from '../components/CustomButton';
import styles from '../styles/styles';
import { useWebSocket } from './WebSocketProvider';
import { PlayCircle, User, Sparkles } from 'lucide-react-native';

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
      // Send a message to join the lobby
      ws.send(JSON.stringify({ action: 'join_lobby', gameId, playerName }));

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.action === 'join_game_response') {
          // Update the isHost state based on the server response
          setIsHost(data.isHost);
          setPlayers(data.players);
        } else if (data.action === 'player_joined') {
          setPlayers(data.players);
        } else if (data.action === 'game_started') {
          router.push({
            pathname: '/multi-player-game',
            params: { gameId, playerName, currentPlayer: data.currentPlayer },
          });
        } else if (data.action === 'player_left') {
          setPlayers(data.players);
        } else if (data.action === 'return_to_lobby') {
          // Update players list and host status when returning to lobby
          setPlayers(data.players);
          setIsHost(data.host === playerName);
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
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#FFD700', '#FF69B4', '#4169E1']}
        style={styles.container}
      >
        <View style={styles.gameWrapper}>
          <Text style={styles.mainHeader}>Magical Gathering</Text>
          <Sparkles style={styles.sparklesIcon} color="#FFD700" />

          <View style={styles.gameContainer}>
            <View style={styles.gameIdContainer}>
              <Text style={styles.gameIdLabel}>Realm Code:</Text>
              <Text style={styles.gameId}>{gameId}</Text>
            </View>

            <View style={styles.playersListContainer}>
              <Text style={styles.heading}>Wizards Present:</Text>
              <FlatList
                data={players}
                renderItem={({ item }) => (
                  <View style={styles.playerItem}>
                    <User color="#6A0DAD" size={24} style={styles.playerIcon} />
                    <Text style={styles.playerName}>{item}</Text>
                  </View>
                )}
                keyExtractor={(item, index) => index.toString()}
              />
            </View>

            <View style={styles.buttonContainer}>
              <CustomButton
                style={[
                  styles.button,
                  (!isHost || players.length < 2) && styles.buttonDisabled,
                ]}
                onPress={startGame}
                disabled={!isHost || players.length < 2}
              >
                <PlayCircle color="#FFFFFF" size={24} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>
                  {isHost ? 'Begin the Duel' : 'Awaiting the Archmage'}
                </Text>
              </CustomButton>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
