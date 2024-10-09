import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, Platform, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles/styles';
import { useRouter } from 'expo-router';
import { useWebSocket } from './WebSocketProvider';
import WebAlert from '../components/WebAlert';
import CustomButton from '../components/CustomButton';
import { Wand2, Users } from 'lucide-react-native';

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
      showAlert('Please enter your wizard name!');
    }
  };

  const joinGame = () => {
    if (playerName.trim()) {
      router.push({
        pathname: '/join-multi-player-game',
        params: { playerName: playerName.trim() },
      });
    } else {
      showAlert('Please enter your wizard name!');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#FFD700', '#FF69B4', '#4169E1']}
        style={styles.container}
      >
        <View style={styles.gameWrapper}>
          <Text style={styles.mainHeader}>Wizard Duel</Text>
          <View style={styles.modeSelectionContainer}>
            <Text style={styles.heading}>Choose Your Path</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter Your Wizard Name"
              placeholderTextColor="#888"
              value={playerName}
              onChangeText={setPlayerName}
            />

            <View style={styles.buttonContainer}>
              <CustomButton style={styles.button} onPress={createGame}>
                <Wand2 color="#FFFFFF" size={24} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Create Magical Realm</Text>
              </CustomButton>
            </View>
            <View style={styles.buttonContainer}>
              <CustomButton style={styles.button} onPress={joinGame}>
                <Users color="#FFFFFF" size={24} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Join Existing Realm</Text>
              </CustomButton>
            </View>
          </View>
        </View>
      </LinearGradient>

      {Platform.OS === 'web' && (
        <WebAlert
          visible={webAlertVisible}
          title="Magical Mishap"
          message={webAlertMessage}
          onClose={() => setWebAlertVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}