// multi-player-game.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles/styles';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWebSocket } from './WebSocketProvider';
import CustomButton from '../components/CustomButton';
import { Sparkles, Star, Lightbulb, Send, History, X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

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
  const [emojiBackground, setEmojiBackground] = useState<boolean>(false);
  const [response, setResponse] = useState<string>('');
  const [emoji, setEmoji] = useState<string>('');
  const [history, setHistory] = useState<
    { player?: string; guess: string; response: string }[]
  >([]);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [guessCount, setGuessCount] = useState<number>(0);
  const [isSideMenuVisible, setIsSideMenuVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showFirstGuessMessage, setShowFirstGuessMessage] = useState<boolean>(true);

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
    if (emoji) {
      setEmojiBackground(true);
    } else {
      setEmojiBackground(false);
    }
  }, [emoji]);

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
      setGuessCount(0);
      setHistory([]);
      setEmoji('');
      setIsSubmitDisabled(data.currentPlayer !== playerName);
      setTurnIndicator(
        data.currentPlayer === playerName ? "It's your turn!" : `It's ${data.currentPlayer}'s turn.`
      );
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
    setGuessCount((prevCount) => prevCount + 1);
    setUserGuess('');
    setShowFirstGuessMessage(false);

    if (data.action === 'correct_guess') {
      setIsGameOver(true);
      if (data.player === playerName) {
        setIsGameWon(true);
        setEmoji(data.winnerEmoji);
        confettiRef.current && confettiRef.current.start();
      } else {
        setIsGameWon(false);
        setEmoji(data.loserEmoji);
      }
    } else {
      setEmoji(data.emoji);
    }
    setIsLoading(false);
  };

  const handleGuessSubmission = () => {
    if (!userGuess.trim()) return;

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
    setGuessCount(0);
    setHistory([]);
    setEmoji('');
    setIsSubmitDisabled(false);
    setEmojiBackground(false);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#FFD700', '#FF69B4', '#4169E1']}
        style={styles.container}
      >
        <View style={styles.gameWrapper}>
          <Text style={styles.mainHeader}>Word Wizardry!</Text>
          <Sparkles style={styles.sparklesIcon} color="#FFD700" />

          <View style={styles.gameContainer}>
            {isGameOver ? (
              isGameWon ? (
                <View style={styles.congratsContent}>
                  <Text style={styles.celebrateEmoji}>{emoji}</Text>
                  <Text style={styles.congratsMessage}>
                    Magical! You've uncovered the secret word!
                  </Text>
                  <View style={styles.buttonContainer}>
                    <CustomButton style={styles.button} onPress={resetGameState}>
                      <Text style={styles.buttonText}>Cast Another Spell</Text>
                    </CustomButton>
                    <CustomButton style={styles.button} onPress={() => router.push('/')}>
                      <Text style={styles.buttonText}>Return to Wizard's Tower</Text>
                    </CustomButton>
                  </View>
                </View>
              ) : (
                <View style={styles.congratsContent}>
                  <Text style={styles.celebrateEmoji}>{emoji}</Text>
                  <Text style={styles.congratsMessage}>
                    The spell is broken! {history[history.length - 1].player} discovered the word.
                  </Text>
                  <View style={styles.buttonContainer}>
                    <CustomButton style={styles.button} onPress={resetGameState}>
                      <Text style={styles.buttonText}>Try Another Incantation</Text>
                    </CustomButton>
                    <CustomButton style={styles.button} onPress={() => router.push('/')}>
                      <Text style={styles.buttonText}>Return to Wizard's Tower</Text>
                    </CustomButton>
                  </View>
                </View>
              )
            ) : (
              <View style={styles.gameContent}>
                {turnIndicator ? (
                  <Text style={styles.turnIndicator}>{turnIndicator}</Text>
                ) : null}
                {showFirstGuessMessage && (
                  <Text style={styles.firstGuessMessage}>Be the first to cast a spell!</Text>
                )}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Whisper your magical guess..."
                    placeholderTextColor="#888"
                    value={userGuess}
                    onChangeText={setUserGuess}
                    editable={!isSubmitDisabled && !isLoading}
                  />
                  <CustomButton
                    style={[styles.sendButton, (isSubmitDisabled || isLoading) && styles.buttonDisabled]}
                    onPress={handleGuessSubmission}
                    disabled={isSubmitDisabled || isLoading}
                  >
                    <Send color="#FFFFFF" size={24} />
                  </CustomButton>
                </View>
                <Text style={styles.guessCounter}>Magical Attempts: {guessCount}</Text>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size={70} color="#40798C" />
                    <Text style={styles.loadingText}>Conjuring response...</Text>
                  </View>
                ) : history.length > 0 ? (
                  <View style={styles.latestMessageContainer}>
                    <View style={styles.guessBubble}>
                      <Text style={styles.messageText}>
                        <Text style={styles.boldText}>
                          {history[history.length - 1].player}'s Spell:
                        </Text>{' '}
                        {history[history.length - 1].guess}
                      </Text>
                    </View>
                    <View style={styles.responseBubble}>
                      <Text style={styles.messageText}>
                        <Text style={styles.boldText}>Crystal Ball Says:</Text>{' '}
                        {history[history.length - 1].response}
                      </Text>
                    </View>
                  </View>
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
                <History color="#FFFFFF" size={24} />
                <Text style={styles.historyButtonText}>
                  {isSideMenuVisible ? 'Hide Spell History' : 'Show Spell History'}
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

          <Modal
            animationType="slide"
            transparent={true}
            visible={isSideMenuVisible}
            onRequestClose={() => {
              setIsSideMenuVisible(false);
            }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.sideMenuContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.heading}>Spell History</Text>
                  <CustomButton
                    style={styles.closeButton}
                    onPress={() => setIsSideMenuVisible(false)}
                  >
                    <X color="#FFFFFF" size={24} />
                  </CustomButton>
                </View>
                <FlatList
                  data={history}
                  keyExtractor={(_, index) => index.toString()}
                  renderItem={({ item }) => (
                    <View>
                      <View style={styles.guessBubble}>
                        <Text style={styles.messageText}>
                          <Text style={styles.boldText}>
                            {item.player ? `${item.player}'s` : 'Your'} Spell:
                          </Text>{' '}
                          {item.guess}
                        </Text>
                      </View>
                      <View style={styles.responseBubble}>
                        <Text style={styles.messageText}>
                          <Text style={styles.boldText}>Crystal Ball:</Text> {item.response}
                        </Text>
                      </View>
                    </View>
                  )}
                  style={styles.messageContainer}
                />
              </View>
            </View>
          </Modal>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
