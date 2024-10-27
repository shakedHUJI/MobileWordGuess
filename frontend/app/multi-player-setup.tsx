import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PlayCircle } from 'lucide-react-native';
import { MotiView } from 'moti';
import CustomButton from '../components/CustomButton';
import styles from '../styles/styles';
import BackButton from '../components/BackButton';
import { useWebSocket } from './WebSocketProvider';

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

const botStyles = [
  { id: 'regular', name: 'Regular Bot' },
  { id: 'emo', name: 'Emo Bot' },
  { id: 'rizz', name: 'Rizz Bot' },
];

export default function MultiPlayerSetup() {
  const router = useRouter();
  const { playerName } = useLocalSearchParams<{ playerName: string }>();
  const [selectedBot, setSelectedBot] = useState(botStyles[0].id);
  const { ws, isConnected } = useWebSocket();

  // Add useEffect to handle WebSocket messages
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
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      Alert.alert('Error', 'Not connected to the server. Please try again.');
      return;
    }

    ws.send(
      JSON.stringify({
        action: 'create_game',
        playerName,
        botStyle: selectedBot,
      })
    );
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
          <Text style={styles.mainHeader}>Start Multi Player Game</Text>

          <View style={styles.gameContainer}>
            <View style={styles.botSelectionContainer}>
              <Text style={styles.heading}>Choose Your Bot:</Text>
              {botStyles.map((bot) => (
                <TouchableOpacity
                  key={bot.id}
                  style={[
                    styles.botOption,
                    selectedBot === bot.id && styles.selectedBotOption,
                  ]}
                  onPress={() => setSelectedBot(bot.id)}
                >
                  <Text
                    style={[
                      styles.botOptionText,
                      selectedBot === bot.id && styles.selectedBotOptionText,
                    ]}
                  >
                    {bot.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonContainer}>
              <CustomButton 
                style={[
                  styles.button,
                  !isConnected && styles.buttonDisabled
                ]} 
                onPress={createGame}
                disabled={!isConnected}
              >
                <PlayCircle color="#1E2A3A" size={24} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>
                  {isConnected ? 'Create Game Lobby' : 'Connecting...'}
                </Text>
              </CustomButton>
            </View>
          </View>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}
