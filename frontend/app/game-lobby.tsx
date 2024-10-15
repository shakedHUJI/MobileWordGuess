import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomButton from '../components/CustomButton';
import styles from '../styles/styles';
import { useWebSocket } from './WebSocketProvider';
import { User, PlayCircle } from 'lucide-react-native';
import { MotiView } from 'moti';

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

        if (data.action === 'join_game_response') {
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
          setPlayers(data.players);
          setIsHost(data.host === playerName);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        Alert.alert('Error', 'Lost connection to the AI arena server.');
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
          'Not connected to the AI arena server. Please try again.'
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AnimatedBackground />
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 1000 }}
          style={styles.gameWrapper}
        >
          <Text style={styles.mainHeader}>Wait for other players</Text>

          <View style={styles.gameContainer}>
            <View style={styles.gameIdContainer}>
              <Text style={styles.gameIdLabel}>Enter code to join:</Text>
              <Text style={styles.gameId}>{gameId}</Text>
            </View>

            <View style={styles.playersListContainer}>
              <Text style={styles.heading}> Challengers:</Text>
              <FlatList
                data={players}
                renderItem={({ item }) => (
                  <View style={styles.playerItem}>
                    <User color="#FF00FF" size={24} style={styles.playerIcon} />
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
                <PlayCircle color="#1E2A3A" size={24} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>
                  {isHost ? 'Beat the Bot!' : 'Awaiting to start the game'}
                </Text>
              </CustomButton>
            </View>
          </View>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}
