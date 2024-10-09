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
  SafeAreaView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles/styles';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useRouter } from 'expo-router';
import CustomButton from '../components/CustomButton';
import { Send, History, X, Wand2 } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface EmojiBackgroundProps {
  emoji: string;
  visible: boolean;
}

const EmojiBackground = ({ emoji, visible }: EmojiBackgroundProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [currentEmoji, setCurrentEmoji] = useState(emoji);

  useEffect(() => {
    if (visible && emoji !== currentEmoji) {
      // Fade out current emoji
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        // Update emoji and fade in
        setCurrentEmoji(emoji);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    } else if (visible) {
      // Just fade in if it's the same emoji
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, emoji]);

  return (
    <Animated.View
      style={{
        ...styles.emojiBackgroundContainer,
        opacity: fadeAnim,
      }}
    >
      {Array.from({ length: Math.ceil(height / 50) }).map((_, rowIndex) => (
        <View key={rowIndex} style={styles.emojiRow}>
          {Array.from({ length: Math.ceil(width / 50) }).map((_, colIndex) => (
            <Text
              key={colIndex}
              style={styles.emojiBackgroundText}
            >
              {currentEmoji}
            </Text>
          ))}
        </View>
      ))}
    </Animated.View>
  );
};

export default function SinglePlayerGame() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>(generateSessionId());
  const [guessCount, setGuessCount] = useState<number>(0);
  const [userGuess, setUserGuess] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [emoji, setEmoji] = useState<string>('');
  const [showEmojiBackground, setShowEmojiBackground] = useState<boolean>(false);
  const [history, setHistory] = useState<{ guess: string; response: string }[]>([]);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [isSideMenuVisible, setIsSideMenuVisible] = useState<boolean>(false);
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
      Alert.alert('Magical Mishap', 'Failed to cast your spell. Try again!');
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
    setShowEmojiBackground(true);

    // Remove the timeout that hides the emoji background
    // The emoji will now stay visible until a new one arrives

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
    setGuessCount(0);
    setHistory([]);
    setSessionId(generateSessionId());
    setEmoji('');
    setFeedbackMessage('');
    setShowEmojiBackground(false);

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
      Alert.alert('Magical Mishap', 'Failed to conjure a new word. Try again!');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#FFD700', '#FF69B4', '#4169E1']}
        style={styles.container}
      >
        <EmojiBackground emoji={emoji} visible={showEmojiBackground} />
        <View style={styles.gameWrapper}>
          <Text style={styles.mainHeader}>Word Wizardry</Text>

          <View style={styles.gameContainer}>
            {feedbackMessage ? (
              <Text style={styles.feedbackMessage}>{feedbackMessage}</Text>
            ) : null}
            {isGameOver ? (
              isGameWon ? (
                <View style={styles.congratsContent}>
                  <Text style={styles.celebrateEmoji}>{emoji || '🎉'}</Text>
                  <Text style={styles.congratsMessage}>
                    Magical! You've uncovered the secret word in {guessCount} spells!
                  </Text>
                  <View style={styles.buttonContainer}>
                    <CustomButton style={styles.button} onPress={resetGameState}>
                      <Wand2 color="#FFFFFF" size={24} style={styles.buttonIcon} />
                      <Text style={styles.buttonText}>Cast Another Spell</Text>
                    </CustomButton>
                    <CustomButton style={styles.button} onPress={() => router.push('/')}>
                      <Text style={styles.buttonText}>Return to Wizard's Tower</Text>
                    </CustomButton>
                  </View>
                </View>
              ) : (
                <View style={styles.congratsContent}>
                  <Text style={styles.celebrateEmoji}>{emoji || '😢'}</Text>
                  <Text style={styles.congratsMessage}>The spell fizzled! Try again, young wizard!</Text>
                  <View style={styles.buttonContainer}>
                    <CustomButton style={styles.button} onPress={resetGameState}>
                      <Wand2 color="#FFFFFF" size={24} style={styles.buttonIcon} />
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
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Whisper your magical guess..."
                    placeholderTextColor="#888"
                    value={userGuess}
                    onChangeText={setUserGuess}
                    editable={!isLoading}
                  />
                  <CustomButton
                    style={[styles.sendButton, isLoading && styles.buttonDisabled]}
                    onPress={handleGuessSubmission}
                    disabled={isLoading}
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
                        <Text style={styles.boldText}>Your Spell:</Text> {history[history.length - 1].guess}
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
                <History color="#FFFFFF" size={24} style={styles.buttonIcon} />
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
                          <Text style={styles.boldText}>Your Spell:</Text> {item.guess}
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