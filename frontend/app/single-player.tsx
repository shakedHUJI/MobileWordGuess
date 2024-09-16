// app/single-player.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import styles from '../styles/styles';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function SinglePlayerGame() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>(generateSessionId());
  const [guessCount, setGuessCount] = useState<number>(0);
  const [userGuess, setUserGuess] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [emoji, setEmoji] = useState<string>('');
  const [history, setHistory] = useState<
    { guess: string; response: string }[]
  >([]);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [isSideMenuVisible, setIsSideMenuVisible] = useState<boolean>(false);
  const [emojiBackground, setEmojiBackground] = useState<boolean>(false);
  const [userGuessDisplay, setUserGuessDisplay] = useState<string>('');

  const confettiRef = useRef<any>(null);

  const serverUrl = 'https://mobilewordguess.onrender.com';

  function generateSessionId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  const handleGuessSubmission = async () => {
    if (!userGuess.trim()) return;

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
                <TouchableOpacity style={styles.button} onPress={resetGameState}>
                  <Text style={styles.buttonText}>Play Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => router.push('/')}
                >
                  <Text style={styles.buttonText}>Back to Main Menu</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.congratsContent}>
              <Text style={styles.celebrateEmoji}>{emoji || '😢'}</Text>
              <Text style={styles.congratsMessage}>
                You've lost! Better luck next time.
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={resetGameState}>
                  <Text style={styles.buttonText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => router.push('/')}
                >
                  <Text style={styles.buttonText}>Back to Main Menu</Text>
                </TouchableOpacity>
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
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleGuessSubmission}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.guessCounter}>Guesses: {guessCount}</Text>
            {response ? (
              <ScrollView style={styles.responseContainer}>
                <Text style={styles.responseText}>
                  <Text style={styles.boldText}>Your Guess:</Text> {userGuessDisplay}
                </Text>
                <Text style={styles.responseText}>
                  <Text style={styles.boldText}>Response:</Text> {response}
                </Text>
              </ScrollView>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.historyButtonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setIsSideMenuVisible(!isSideMenuVisible)}
        >
          <Text style={styles.buttonText}>
            {isSideMenuVisible ? 'Hide Guess History' : 'Show Guess History'}
          </Text>
        </TouchableOpacity>
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
              <View style={styles.historyItem}>
                <Text style={styles.historyText}>
                  <Text style={styles.boldText}>Your Guess:</Text> {item.guess}
                </Text>
                <Text style={styles.historyText}>
                  <Text style={styles.boldText}>Response:</Text> {item.response}
                </Text>
              </View>
            )}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setIsSideMenuVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
