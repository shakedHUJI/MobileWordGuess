// single-player.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import styles from '../styles/styles';
import { useRouter } from 'expo-router';
import CustomButton from '../components/CustomButton';
import {  Send, History, X, Wand2, ArrowLeft, Info } from 'lucide-react-native';
import { MotiView } from 'moti';
import ConfettiCannon from 'react-native-confetti-cannon';
import BackButton from '../components/BackButton';
import Popup from '../components/Popup';
import HintButton from '../components/HintButton';


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

// Add this import at the top of the file
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [popupVisible, setPopupVisible] = useState<boolean>(false);
  const gameInstructions = `🤖 The Bot has a secret word up its sleeve.

🎯 Your mission: Guess the word in as few attempts as possible.

💡 After each guess, the Bot will drop a clue connecting your guess to the secret word.

🔎 Keep hunting for hints until you crack the code!

Good luck, and may the sharpest mind win!
`;
  const [isExceedingLimit, setIsExceedingLimit] = useState<boolean>(false);
  const [isExceedingSpaceLimit, setIsExceedingSpaceLimit] = useState<boolean>(false);

  const confettiRef = useRef<any>(null);

  const serverUrl = 'https://mobilewordguess.onrender.com';

  function generateSessionId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  useEffect(() => {
    const checkFirstVisit = async () => {
      try {
        const hasVisited = await AsyncStorage.getItem('hasVisitedSinglePlayer');
        if (hasVisited === null) {
          setPopupVisible(true);
          await AsyncStorage.setItem('hasVisitedSinglePlayer', 'true');
        }
      } catch (error) {
        console.error('Error checking first visit:', error);
      }
    };

    checkFirstVisit();
  }, []);

  useEffect(() => {
    setIsExceedingLimit(userGuess.length >= 30);
    setIsExceedingSpaceLimit(userGuess.split(' ').length > 2);
  }, [userGuess]);

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
    setEmoji(data.emoji || '');

    if (data.response && data.response.includes('Congratulations!')) {
      setIsGameWon(true);
      setIsGameOver(true);
      setEmoji('🥳');
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

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter') {
      handleGuessSubmission();
    }
  };

  const toggleInstructions = () => {
    setPopupVisible(!popupVisible);
  };

  const handleHintPress = () => {
    // Implement hint functionality here
    Alert.alert('Hint', 'Hint functionality coming soon!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AnimatedBackground emoji={emoji} />
        <BackButton shouldConfirm={true} goToIndex={true} />
        <TouchableOpacity style={styles.instructionsButton} onPress={toggleInstructions}>
          <Info color="#1E2A3A" size={24} />
        </TouchableOpacity>
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 1000 }}
          style={styles.gameWrapper}
        >
          <Text style={styles.mainHeader}>Beat the bot!</Text>

          <View style={styles.gameContainer}>
            {feedbackMessage ? (
              <Text style={styles.feedbackMessage}>{feedbackMessage}</Text>
            ) : null}
            {isGameOver ? (
              isGameWon ? (
                <View style={styles.congratsContent}>
                  <Text style={styles.celebrateEmoji}>{emoji || '🥳'}</Text>
                  <Text style={styles.congratsMessage}>
                    Impressive! You've cracked the code in {guessCount} attempts!
                  </Text>
                  <View style={styles.buttonContainer}>
                    <CustomButton style={styles.button} onPress={resetGameState}>
                      <Wand2 color="#1E2A3A" size={24} style={styles.buttonIcon} />
                      <Text style={styles.buttonText}>Start New Challenge</Text>
                    </CustomButton>
                    <CustomButton style={styles.button} onPress={() => router.replace('/')}>
                      <Text style={styles.buttonText}>Return to Main Menu</Text>
                    </CustomButton>
                  </View>
                </View>
              ) : (
                <View style={styles.congratsContent}>
                  <Text style={styles.celebrateEmoji}>🫠</Text>
                  <Text style={styles.congratsMessage}>
                    Challenge failed! Try again, code breaker!
                  </Text>
                  <View style={styles.buttonContainer}>
                    <CustomButton style={styles.button} onPress={resetGameState}>
                      <Wand2 color="#1E2A3A" size={24} style={styles.buttonIcon} />
                      <Text style={styles.buttonText}>Try Again</Text>
                    </CustomButton>
                    <CustomButton style={styles.button} onPress={() => router.replace('/')}>
                      <Text style={styles.buttonText}>Return to Main Menu</Text>
                    </CustomButton>
                  </View>
                </View>
              )
            ) : (
              <View style={styles.gameContent}>
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
                    editable={!isLoading}
                    onKeyPress={handleKeyPress}
                    onSubmitEditing={handleGuessSubmission}
                  />
                  <CustomButton
                    style={[styles.sendButton, isLoading && styles.buttonDisabled]}
                    onPress={handleGuessSubmission}
                    disabled={isLoading || isExceedingLimit || isExceedingSpaceLimit}
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
                <Text style={styles.guessCounter}>Attempts: {guessCount}</Text>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size={70} color="#40798C" />
                    <Text style={styles.loadingText}>Processing...</Text>
                  </View>
                ) : history.length > 0 ? (
                  <ScrollView
                    style={styles.latestMessageContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.guessBubble}>
                      <Text style={styles.messageText}>
                        <Text style={styles.boldText}>Your Guess:</Text>{' '}
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
              <HintButton onPress={handleHintPress}/>
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
                          <Text style={styles.boldText}>Your Guess:</Text> {item.guess}
                        </Text>
                      </View>
                      <View style={styles.responseBubble}>
                        <Text style={styles.messageText}>
                          <Text style={styles.boldText}>Bot's Response:</Text> {item.response}
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

        <Popup
          isVisible={popupVisible}
          onClose={toggleInstructions}
          title="Welcome to Beat the Bot!"
          content={gameInstructions}
        />
      </View>
    </SafeAreaView>
  );
}
