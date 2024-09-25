// single-player-game.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import styles from '../styles/styles';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useRouter } from 'expo-router';
import CustomButton from '../components/CustomButton';

const { width, height } = Dimensions.get('window');

export default function SinglePlayerGame() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>(generateSessionId());
  const [guessCount, setGuessCount] = useState<number>(0);
  const [userGuess, setUserGuess] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [emoji, setEmoji] = useState<string>('');
  const [history, setHistory] = useState<{ guess: string; response: string }[]>([]);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [isSideMenuVisible, setIsSideMenuVisible] = useState<boolean>(false);
  const [emojiBackground, setEmojiBackground] = useState<boolean>(false);
  const [userGuessDisplay, setUserGuessDisplay] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const confettiRef = useRef<any>(null);

  const serverUrl = 'https://mobilewordguess.onrender.com';

  function generateSessionId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  const handleGuessSubmission = async () => {
    if (!userGuess.trim()) return;

    setIsLoading(true);
    setGuessCount(guessCount + 1);

    const postData: any = {
      userGuess: userGuess.trim(),
      mode: 'single',
      sessionId: sessionId,
    };

    try {
      const response = await fetch(`${serverUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(postData).toString(),
      });

      const data = await response.json();
      updateGameUI(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit your guess.');
    } finally {
      setIsLoading(false);
    }

    setUserGuess('');
  };

  const updateGameUI = (data: any) => {
    setHistory((prevHistory) => [
      ...prevHistory,
      {
        guess: data.yourGuess || userGuess,
        response: data.response,
      },
    ]);

    setResponse(data.response);
    setEmoji(data.emoji);
    setUserGuessDisplay(userGuess);

    if (data.response && data.response.includes('Congratulations!')) {
      setIsGameWon(true);
      setIsGameOver(true);
      confettiRef.current && confettiRef.current.start();
    }
  };

  const resetGameState = () => {
    setIsGameWon(false);
    setIsGameOver(false);
    setResponse('');
    setUserGuess('');
    setUserGuessDisplay('');
    setGuessCount(0);
    setHistory([]);
    setSessionId(generateSessionId());
    setEmoji('');
    setFeedbackMessage('');
    setEmojiBackground(false);

    fetch(`${serverUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        mode: 'single',
        sessionId: sessionId,
        generateNewWord: 'true',
      }).toString(),
    }).catch(() => {
      Alert.alert('Error', 'Failed to reset the game.');
    });
  };

  useEffect(() => {
    if (emoji) {
      setEmojiBackground(true);
    } else {
      setEmojiBackground(false);
    }
  }, [emoji]);

  return (
    <View style={styles.container}>
      {emojiBackground && (
        <View style={styles.emojiBackgroundContainer}>
          {Array.from({ length: Math.ceil(height / 50) }).map((_, rowIndex) => (
            <View key={rowIndex} style={styles.emojiRow}>
              {Array.from({ length: Math.ceil(width / 50) }).map((_, colIndex) => (
                <Text key={colIndex} style={styles.emojiBackgroundText}>
                  {emoji}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}

      <Text style={styles.mainHeader}>Word Guess</Text>

      <View style={styles.gameContainer}>
        {feedbackMessage ? (
          <Text style={styles.feedbackMessage}>{feedbackMessage}</Text>
        ) : null}
        {isGameOver ? (
          isGameWon ? (
            <View style={styles.congratsContent}>
              <Text style={styles.celebrateEmoji}>{emoji || '🥳'}</Text>
              <Text style={styles.congratsMessage}>
                Congratulations! You've guessed the secret word using {guessCount} guesses!
              </Text>
              <View style={styles.buttonContainer}>
                <CustomButton style={styles.button} onPress={resetGameState}>
                  <Text style={styles.buttonText}>Play Again</Text>
                </CustomButton>
                <CustomButton style={styles.button} onPress={() => router.push('/')}>
                  <Text style={styles.buttonText}>Back to Main Menu</Text>
                </CustomButton>
              </View>
            </View>
          ) : (
            <View style={styles.congratsContent}>
              <Text style={styles.celebrateEmoji}>{emoji || '😢'}</Text>
              <Text style={styles.congratsMessage}>You've lost! Better luck next time.</Text>
              <View style={styles.buttonContainer}>
                <CustomButton style={styles.button} onPress={resetGameState}>
                  <Text style={styles.buttonText}>Try Again</Text>
                </CustomButton>
                <CustomButton style={styles.button} onPress={() => router.push('/')}>
                  <Text style={styles.buttonText}>Back to Main Menu</Text>
                </CustomButton>
              </View>
            </View>
          )
        ) : (
          <View style={styles.gameContent}>
            <TextInput
              style={styles.input}
              placeholder="Enter your guess"
              placeholderTextColor="#888"
              value={userGuess}
              onChangeText={setUserGuess}
              editable={!isLoading}
            />
            <View style={styles.buttonContainer}>
              <CustomButton
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleGuessSubmission}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </CustomButton>
            </View>
            <Text style={styles.guessCounter}>Guesses: {guessCount}</Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size={70} color="#40798C" />
                <Text style={styles.loadingText}>Processing your guess...</Text>
              </View>
            ) : history.length > 0 ? (
              <View style={styles.latestMessageContainer}>
                <View style={styles.guessBubble}>
                  <Text style={styles.messageText}>
                    <Text style={styles.boldText}>Your Guess:</Text> {history[history.length - 1].guess}
                  </Text>
                </View>
                <View style={styles.responseBubble}>
                  <Text style={styles.messageText}>
                    <Text style={styles.boldText}>Response:</Text>{' '}
                    {history[history.length - 1].response}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.historyButtonContainer}>
        <CustomButton
          style={styles.button}
          onPress={() => setIsSideMenuVisible(!isSideMenuVisible)}
        >
          <Text style={styles.buttonText}>
            {isSideMenuVisible ? 'Hide Guess History' : 'Show Guess History'}
          </Text>
        </CustomButton>
      </View>

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
        transparent={false}
        visible={isSideMenuVisible}
        onRequestClose={() => {
          setIsSideMenuVisible(false);
        }}
      >
        <View style={styles.sideMenuContent}>
          <Text style={styles.heading}>Guess History</Text>
          <FlatList
            data={history}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View>
                <View style={styles.guessBubble}>
                  <Text style={styles.messageText}>
                    <Text style={styles.boldText}>Your Guess:</Text> {item.guess}
                  </Text>
                </View>
                <View style={styles.responseBubble}>
                  <Text style={styles.messageText}>
                    <Text style={styles.boldText}>Response:</Text> {item.response}
                  </Text>
                </View>
              </View>
            )}
            style={styles.messageContainer}
          />
          <View style={styles.buttonContainer}>
            <CustomButton style={styles.button} onPress={() => setIsSideMenuVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </CustomButton>
          </View>
        </View>
      </Modal>
    </View>
  );
}
