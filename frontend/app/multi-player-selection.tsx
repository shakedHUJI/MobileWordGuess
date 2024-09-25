// MultiPlayerSelection.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, Platform } from 'react-native';
import styles from '../styles/styles';
import { useRouter } from 'expo-router';
import { useWebSocket } from './WebSocketProvider';
import WebAlert from '../components/WebAlert';
import CustomButton from '../components/CustomButton';

export default function MultiPlayerSelection() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState<string>('');
  const { ws, isConnected } = useWebSocket();
  const [webAlertVisible, setWebAlertVisible] = useState(false);
  const [webAlertMessage, setWebAlertMessage] = useState('');

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

  const showAlert = (message: string) => {
    if (Platform.OS === 'web') {
      setWebAlertMessage(message);
      setWebAlertVisible(true);
    } else {
      Alert.alert('Error', message);
    }
  };

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
        showAlert('Not connected to the game server. Please try again.');
      }
    } else {
      showAlert('Enter you name dummy!');
    }
  };

  const joinGame = () => {
    if (playerName.trim()) {
      router.push({
        pathname: '/join-multi-player-game',
        params: { playerName: playerName.trim() },
      });
    } else {
      showAlert('Enter you name dummy!');
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
          <CustomButton style={styles.button} onPress={createGame}>
            <Text style={styles.buttonText}>Create Game</Text>
          </CustomButton>
        </View>
        <View style={styles.buttonContainer}>
          <CustomButton
            style={styles.button}
            onPress={joinGame}
          >
            <Text style={styles.buttonText}>Join Game</Text>
          </CustomButton>
        </View>
      </View>

      {Platform.OS === 'web' && (
        <WebAlert
          visible={webAlertVisible}
          title="Error"
          message={webAlertMessage}
          onClose={() => setWebAlertVisible(false)}
        />
      )}
    </View>
  );
}
