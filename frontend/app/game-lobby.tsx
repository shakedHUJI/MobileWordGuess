import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import styles from '../styles/styles';

export default function GameLobby() {
  const router = useRouter();
  const { playerName, gameId } = useLocalSearchParams<{ playerName: string, gameId: string }>();
  const [players, setPlayers] = useState<string[]>([playerName || 'Player 1']);

  const startGame = () => {
    // Implement game start logic here
    router.push('/multi-player-game');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainHeader}>Hello {playerName}</Text>
      
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
          style={[styles.button, players.length < 2 && styles.buttonDisabled]}
          onPress={startGame}
          disabled={players.length < 2}
        >
          <Text style={styles.buttonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
