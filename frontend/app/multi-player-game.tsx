// multi-player-game.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import styles from '../styles/styles';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWebSocket } from './WebSocketProvider';
import CustomButton from '../components/CustomButton';
import { Send, History, X } from 'lucide-react-native';
import { MotiView } from 'moti';
import BackButton from '../components/BackButton';

// Define the props type for AnimatedBackground
interface AnimatedBackgroundProps {
  emoji: string;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = React.memo(({ emoji }) => {
  return (
    <>
      {[...Array(20)].map((_, index) => {
        const randomTop = Math.random() * 100;
        const randomLeft = Math.random() * 100;

        return (
          <MotiView
            key={index}
            from={{
              opacity: 0,
              scale: 0.5,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              type: 'timing',
              duration: 3000,
              loop: true,
              delay: index * 200,
              repeatReverse: false,
            }}
            style={[
              styles.animatedEmoji,
              {
                position: 'absolute',
                top: `${randomTop}%`,
                left: `${randomLeft}%`,
              },
            ]}
          >
            <Text style={styles.emojiText}>{emoji || '✨'}</Text>
          </MotiView>
        );
      })}
    </>
  );
});

export default function MultiPlayerGame() {
  const router = useRouter();
  const { gameId, playerName, currentPlayer: initialCurrentPlayer } = useLocalSearchParams<{
    gameId: string;
    playerName: string;
    currentPlayer: string;
  }>();
  const [currentPlayer, setCurrentPlayer] = useState<string>(initialCurrentPlayer);
  const [turnIndicator, setTurnIndicator] = useState<string>(
    initialCurrentPlayer === playerName ? "It's your turn!" : `It's ${initialCurrentPlayer}'s turn.`
  );
  const [userGuess, setUserGuess] = useState<string>('');
  const [isSubmitDisabled, setIsSubmitDisabled] = useState<boolean>(
    initialCurrentPlayer !== playerName
  );
  const [response, setResponse] = useState<string>('');
  const [history, setHistory] = useState<
    { player?: string; guess: string; response: string }[]
  >([]);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [playerGuesses, setPlayerGuesses] = useState<{ [key: string]: number }>({});
  const [isSideMenuVisible, setIsSideMenuVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showFirstGuessMessage, setShowFirstGuessMessage] = useState<boolean>(
    initialCurrentPlayer === playerName
  );
  const [emoji, setEmoji] = useState<string>('');
  const [isExceedingLimit, setIsExceedingLimit] = useState<boolean>(false);
  const [isExceedingSpaceLimit, setIsExceedingSpaceLimit] = useState<boolean>(false);

  const confettiRef = useRef<any>(null);
  const { ws } = useWebSocket();

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleGameStateUpdate(data);
      };
    }
  }, [ws]);

  useEffect(() => {
    setIsExceedingLimit(userGuess.length >= 30);
    setIsExceedingSpaceLimit(userGuess.split(' ').length > 2);
  }, [userGuess]);

  const handleGameStateUpdate = (data: any) => {
    console.log('Received WebSocket message:', data);

    if (data.action === 'game_update' || data.action === 'correct_guess') {
      setCurrentPlayer(data.currentPlayer);
      setTurnIndicator(
        data.currentPlayer === playerName ? "It's your turn!" : `It's ${data.currentPlayer}'s turn.`
      );
      setIsSubmitDisabled(data.currentPlayer !== playerName);
      updateGameUI(data);
    } else if (data.action === 'player_joined' && data.startingPlayer) {
      setCurrentPlayer(data.startingPlayer);
      setTurnIndicator(
        data.startingPlayer === playerName ? "It's your turn!" : `It's ${data.startingPlayer}'s turn.`
      );
      setIsSubmitDisabled(data.startingPlayer !== playerName);
    } else if (data.action === 'game_reset') {
      setIsGameWon(false);
      setIsGameOver(false);
      setResponse('');
      setUserGuess('');
      setHistory([]);
      setIsSubmitDisabled(data.currentPlayer !== playerName);
      setTurnIndicator(
        data.currentPlayer === playerName ? "It's your turn!" : `It's ${data.currentPlayer}'s turn.`
      );
      setPlayerGuesses({});
    } else if (data.action === 'return_to_lobby') {
      const isHost = data.host === playerName;
      router.push({
        pathname: '/game-lobby',
        params: {
          gameId,
          playerName,
          players: JSON.stringify(data.players),
          isHost: isHost.toString(),
        },
      });
    }
  };

  const updateGameUI = (data: any) => {
    setHistory((prevHistory) => [
      ...prevHistory,
      {
        player: data.player,
        guess: data.guess,
        response: data.response,
      },
    ]);

    setResponse(data.response);
    setUserGuess('');
    setShowFirstGuessMessage(false);

    if (data.emoji) {
      setEmoji(data.emoji);
    }

    if (data.action === 'correct_guess') {
      setIsGameOver(true);
      if (data.player === playerName) {
        setIsGameWon(true);
        setEmoji('🥳');
        confettiRef.current && confettiRef.current.start();
      } else {
        setIsGameWon(false);
        setEmoji('🫠');
      }
    }
    setIsLoading(false);

    setPlayerGuesses((prevGuesses) => ({
      ...prevGuesses,
      [data.player]: (prevGuesses[data.player] || 0) + 1,
    }));
  };

  const handleGuessSubmission = () => {
    if (!userGuess.trim() || isSubmitDisabled || isLoading || isExceedingLimit || isExceedingSpaceLimit) return;

    setIsLoading(true);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          action: 'submit_guess',
          gameId,
          playerName,
          userGuess: userGuess.trim(),
        })
      );
    } else {
      setIsLoading(false);
      Alert.alert('Error', 'WebSocket connection is not open.');
    }
  };

  const resetGameState = () => {
    setIsGameWon(false);
    setIsGameOver(false);
    setResponse('');
    setUserGuess('');
    setHistory([]);
    setIsSubmitDisabled(false);
    setShowFirstGuessMessage(true);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          action: 'play_again',
          gameId,
          playerName,
        })
      );
    } else {
      Alert.alert('Error', 'WebSocket connection is not open.');
      router.push('/');
    }
  };

  // Add this new function to handle key press events
  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter') {
      handleGuessSubmission();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AnimatedBackground emoji={emoji} />
        <BackButton 
          shouldConfirm={true} 
          goToIndex={true} 
          confirmMessage="Are you sure you want to leave the game?"
        />
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 1000 }}
          style={styles.gameWrapper}
        >
          <Text style={styles.mainHeader}>Beat the Bot!</Text>
          <View style={styles.gameContainer}>
            {isGameOver ? (
              isGameWon ? (
                <View style={styles.congratsContent}>
                  <Text style={styles.celebrateEmoji}>{emoji || '🥳'}</Text>
                  <Text style={styles.congratsMessage}>
                    You've gueesed the secret word! You've outsmarted the AI!
                  </Text>
                  <View style={styles.buttonContainer}>
                    <CustomButton style={styles.button} onPress={resetGameState}>
                      <Text style={styles.buttonText}>Start New Game</Text>
                    </CustomButton>
                    <CustomButton style={styles.button} onPress={() => router.push('/')}>
                      <Text style={styles.buttonText}>Return to main menu</Text>
                    </CustomButton>
                  </View>
                </View>
              ) : (
                <View style={styles.congratsContent}>
                  <Text style={styles.celebrateEmoji}>{emoji || '🫠'}</Text>
                  <Text style={styles.congratsMessage}>
                    You've been outsmarted! {history[history.length - 1].player} cracked the code.
                  </Text>
                  <View style={styles.buttonContainer}>
                    <CustomButton style={styles.button} onPress={resetGameState}>
                      <Text style={styles.buttonText}>Rematch</Text>
                    </CustomButton>
                    <CustomButton style={styles.button} onPress={() => router.push('/')}>
                      <Text style={styles.buttonText}>Return to Main menu</Text>
                    </CustomButton>
                  </View>
                </View>
              )
            ) : (
              <View style={styles.gameContent}>
                {turnIndicator ? (
                  <Text style={styles.turnIndicator}>{turnIndicator}</Text>
                ) : null}
                {showFirstGuessMessage && currentPlayer === playerName && (
                  <Text style={styles.firstGuessMessage}>
                    Be the first to challenge the Bot!
                  </Text>
                )}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your guess..."
                    placeholderTextColor="#888"
                    value={userGuess}
                    onChangeText={(text) => {
                      let newText = text;
                      const spaceCount = text.split(' ').length - 1;
                      
                      if (spaceCount > 1) {
                        // If there's more than one space, remove extra spaces
                        newText = text.replace(/\s+/g, ' ').trim();
                        setIsExceedingSpaceLimit(true);
                      } else {
                        setIsExceedingSpaceLimit(false);
                      }

                      if (newText.length <= 30) {
                        setUserGuess(newText);
                      }
                      setIsExceedingLimit(newText.length >= 30);
                    }}
                    maxLength={30}
                    editable={!isSubmitDisabled && !isLoading}
                    onKeyPress={handleKeyPress}
                    onSubmitEditing={handleGuessSubmission}
                  />
                  <CustomButton
                    style={[
                      styles.sendButton,
                      (isSubmitDisabled || isLoading || isExceedingLimit || isExceedingSpaceLimit) && styles.buttonDisabled,
                    ]}
                    onPress={handleGuessSubmission}
                    disabled={isSubmitDisabled || isLoading || isExceedingLimit || isExceedingSpaceLimit}
                  >
                    <Send color="#1E2A3A" size={24} />
                  </CustomButton>
                </View>
                {isExceedingLimit && (
                  <Text style={styles.errorText}>
                    Character limit reached (max 30 characters)
                  </Text>
                )}
                {isExceedingSpaceLimit && (
                  <Text style={styles.errorText}>
                    Only one space allowed
                  </Text>
                )}
                <Text style={styles.guessCounter}>
                  Your Guesses: {playerGuesses[playerName] || 0}
                </Text>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size={70} color="#00FFFF" />
                    <Text style={styles.loadingText}>AI Processing...</Text>
                  </View>
                ) : history.length > 0 ? (
                  <ScrollView
                    style={styles.latestMessageContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.guessBubble}>
                      <Text style={styles.messageText}>
                        <Text style={styles.boldText}>
                          {history[history.length - 1].player}'s Guess:
                        </Text>{' '}
                        {history[history.length - 1].guess}
                      </Text>
                    </View>
                    <View style={styles.responseBubble}>
                      <Text style={styles.messageText}>
                        <Text style={styles.boldText}>Bot's Response:</Text>{' '}
                        {history[history.length - 1].response}
                      </Text>
                    </View>
                  </ScrollView>
                ) : null}
              </View>
            )}
          </View>

          {!isGameOver && (
            <View style={styles.historyButtonContainer}>
              <CustomButton
                style={styles.historyButton}
                onPress={() => setIsSideMenuVisible(!isSideMenuVisible)}
              >
                <History color="#1E2A3A" size={24} />
                <Text style={styles.historyButtonText}>
                  {isSideMenuVisible ? 'Hide Guess History' : 'Show Guess History'}
                </Text>
              </CustomButton>
            </View>
          )}

          {isGameWon && (
            <ConfettiCannon
              count={200}
              origin={{ x: -10, y: 0 }}
              autoStart={true}
              fadeOut={true}
              ref={confettiRef}
            />
          )}
        </MotiView>

        <Modal
          animationType="slide"
          transparent={false}
          visible={isSideMenuVisible}
          onRequestClose={() => {
            setIsSideMenuVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.sideMenuContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.heading}>Guess History</Text>
                <CustomButton
                  style={styles.closeButton}
                  onPress={() => setIsSideMenuVisible(false)}
                >
                  <X color="#1E2A3A" size={24} />
                </CustomButton>
              </View>
              <View style={{ flex: 1 }}>
                <FlatList
                  data={history}
                  keyExtractor={(_, index) => index.toString()}
                  renderItem={({ item }) => (
                    <View>
                      <View style={styles.guessBubble}>
                        <Text style={styles.messageText}>
                          <Text style={styles.boldText}>
                            {item.player ? `${item.player}'s` : 'Your'} Guess:
                          </Text>{' '}
                          {item.guess}
                        </Text>
                      </View>
                      <View style={styles.responseBubble}>
                        <Text style={styles.messageText}>
                          <Text style={styles.boldText}>Bot'sResponse:</Text> {item.response}
                        </Text>
                      </View>
                    </View>
                  )}
                  style={styles.messageContainer}
                  contentContainerStyle={{ flexGrow: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
