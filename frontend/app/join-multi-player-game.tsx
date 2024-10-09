import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import styles from '../styles/styles';
import { useWebSocket } from './WebSocketProvider';
import CustomButton from '../components/CustomButton';
import { LogIn } from 'lucide-react-native';

const JoinMultiPlayerGame = () => {
  const router = useRouter();
  const { playerName } = useLocalSearchParams<{ playerName: string }>();
  const [gameId, setGameId] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [isJoining, setIsJoining] = useState(false);
  const { ws } = useWebSocket();

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        if (data.action === 'join_game_response') {
          setIsJoining(false);
          if (data.success) {
            router.push({
              pathname: '/game-lobby',
              params: {
                playerName,
                gameId: data.gameId,
                players: JSON.stringify(data.players),
                isHost: data.isHost.toString(),
              },
            });
          } else {
            Alert.alert('Magical Mishap', data.message || 'Failed to join the magical realm.');
          }
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsJoining(false);
        Alert.alert('Magical Mishap', 'Failed to connect to the enchanted realm.');
      };
    }
  }, [ws]);

  const handleInputChange = (text: string, index: number) => {
    const newGameId = [...gameId];
    const uppercaseText = text.toUpperCase();
    
    // Handle pasting
    if (uppercaseText.length > 1) {
      const pastedChars = uppercaseText.split('').slice(0, 6);
      for (let i = 0; i < pastedChars.length; i++) {
        if (index + i < 6) {
          newGameId[index + i] = pastedChars[i];
        }
      }
      setGameId(newGameId);
      // Focus on the last filled input or the last input
      const lastFilledIndex = Math.min(index + pastedChars.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
      
      // If all 6 characters are filled, join the game
      if (newGameId.every(char => char !== '')) {
        joinGame(newGameId.join(''));
      }
    } else {
      // Handle single character input
      newGameId[index] = uppercaseText;
      setGameId(newGameId);
      if (uppercaseText && index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else if (index === 5 && uppercaseText) {
        // If the 6th character is entered, join the game
        joinGame(newGameId.join(''));
      }
    }
  };

  const handleBackspace = (index: number) => {
    if (gameId[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const joinGame = (fullGameId: string) => {
    if (
      fullGameId.length === 6 &&
      ws &&
      ws.readyState === WebSocket.OPEN &&
      !isJoining
    ) {
      setIsJoining(true);
      ws.send(
        JSON.stringify({
          action: 'join_game',
          gameId: fullGameId,
          playerName,
        })
      );
    } else if (fullGameId.length !== 6) {
      Alert.alert('Magical Mishap', 'Please enter a complete 6-character Realm Code');
    } else if (isJoining) {
      // Do nothing if already joining
    } else {
      Alert.alert(
        'Magical Mishap',
        'The magical connection is lost. Please try again.'
      );
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#FFD700', '#FF69B4', '#4169E1']}
        style={styles.container}
      >
        <View style={styles.gameWrapper}>
          <Text style={styles.mainHeader}>Join Magical Realm</Text>
          <Text style={styles.heading}>Enter Realm Code</Text>
          <View style={localStyles.gameIdContainer}>
            {gameId.map((char, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={localStyles.input}
                value={char}
                onChangeText={(text) => handleInputChange(text, index)}
                maxLength={6} // Allow pasting up to 6 characters
                keyboardType="default"
                autoCapitalize="characters"
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace') {
                    handleBackspace(index);
                  }
                }}
              />
            ))}
          </View>
          <View style={styles.buttonContainer}>
            <CustomButton
              style={[styles.button, isJoining && styles.buttonDisabled]}
              onPress={() => joinGame(gameId.join(''))}
              disabled={isJoining}
            >
              <LogIn color="#FFFFFF" size={24} style={styles.buttonIcon} />
              <Text style={styles.buttonText}>
                {isJoining ? 'Entering Realm...' : 'Enter Magical Realm'}
              </Text>
            </CustomButton>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  gameIdContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  input: {
    width: 40,
    height: 50,
    borderWidth: 2,
    borderColor: '#FF69B4',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 24,
    marginHorizontal: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    color: '#4A0E4E',
  },
});

export default JoinMultiPlayerGame;