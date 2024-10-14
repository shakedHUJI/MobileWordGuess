import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, SafeAreaView, Platform } from 'react-native';
import styles from '../styles/styles';
import { useRouter } from 'expo-router';
import { useWebSocket } from './WebSocketProvider';
import CustomButton from '../components/CustomButton';
import { Zap, Wand2, Users } from 'lucide-react-native';
import { MotiView } from 'moti';
import BackButton from '../components/BackButton';

const AnimatedBackground = React.memo(() => {
  return (
    <>
      {[...Array(20)].map((_, index) => (
        <MotiView
          key={index}
          from={{
            opacity: 0,
            scale: 1,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [1, 1.5, 1],
          }}
          transition={{
            type: 'timing',
            duration: 3000,
            loop: true,
            delay: index * 200,
            repeatReverse: false,
          }}
          style={[
            styles.animatedBackground,
            {
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#00FFFF',
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            },
          ]}
        />
      ))}
    </>
  );
});

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

  const showAlert = (message: string) => {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('Alert', message);
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
      showAlert('Please enter your name!');
    }
  };

  const joinGame = () => {
    if (playerName.trim()) {
      router.push({
        pathname: '/join-multi-player-game',
        params: { playerName: playerName.trim() },
      });
    } else {
      showAlert('Please enter your nickname!');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AnimatedBackground />
        <BackButton shouldConfirm={false} goToIndex={true} />
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 1000 }}
          style={styles.gameWrapper}
        >
          <Text style={styles.mainHeader}>Beat the bot!</Text>
          <Zap style={styles.sparklesIcon} color="#1E2A3A" size={32} />

          <View style={styles.gameContainer}>
            <Text style={styles.heading}>Enter your nickname</Text>

            <TextInput
              style={styles.wizardNameInput}
              placeholder="Fill me up!"
              placeholderTextColor="#888"
              value={playerName}
              onChangeText={setPlayerName}
            />

            <View style={styles.buttonContainer}>
              <CustomButton style={styles.button} onPress={createGame}>
                <Wand2 color="#1E2A3A" size={24} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Create new game</Text>
              </CustomButton>
            </View>
            <View style={styles.buttonContainer}>
              <CustomButton style={styles.button} onPress={joinGame}>
                <Users color="#1E2A3A" size={24} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Join game</Text>
              </CustomButton>
            </View>
          </View>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}
