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
  StyleSheet,
  Dimensions,
} from 'react-native';
import styles from '../styles/styles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomButton from '../components/CustomButton';
import {  Send, History, X, Wand2, ArrowLeft, Info } from 'lucide-react-native';
import { MotiView } from 'moti';
import ConfettiCannon from 'react-native-confetti-cannon';
import BackButton from '../components/BackButton';
import Popup from '../components/Popup';
import HintButton from '../components/HintButton';
import HintBox from '../components/HintBox';


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

// Add this new component
const SeparatedInputBoxes: React.FC<{
  wordLength: number;
  userGuess: string;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
  isLoading: boolean;
  revealedCharacters: { [key: number]: string };
}> = ({ wordLength, userGuess, onChangeText, onSubmitEditing, isLoading, revealedCharacters }) => {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [boxSize, setBoxSize] = useState(40); // Default size

  useEffect(() => {
    const screenWidth = Dimensions.get('window').width;
    const containerWidth = Math.min(screenWidth * 0.9, 350); // Assuming max container width of 400
    const spacing = 5; // Spacing between boxes
    const totalSpacing = spacing * (wordLength - 1);
    const availableWidth = containerWidth - totalSpacing;
    const calculatedSize = Math.floor(availableWidth / wordLength);
    console.log('calculatedSize', calculatedSize);
    setBoxSize(Math.min(calculatedSize, 40)); // Use the smaller of calculated or max size
  }, [wordLength]);

  const handleInputChange = (text: string, index: number) => {
    if (revealedCharacters[index]) return; // Prevent changing revealed characters

    const newGuess = userGuess.split('');
    newGuess[index] = text.toLowerCase();
    onChangeText(newGuess.join(''));

    if (text) {
      let nextIndex = index + 1;
      while (nextIndex < wordLength && revealedCharacters[nextIndex]) {
        nextIndex++;
      }
      if (nextIndex < wordLength) {
        inputRefs.current[nextIndex]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !userGuess[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={localStyles.separatedInputContainer}>
      {[...Array(wordLength)].map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          style={[
            localStyles.separatedInput,
            { width: boxSize, height: boxSize, fontSize: boxSize * 0.6 },
            revealedCharacters[index] ? localStyles.revealedCharacter : {}
          ]}
          value={revealedCharacters[index] || userGuess[index] || ''}
          onChangeText={(text) => handleInputChange(text, index)}
          maxLength={1}
          keyboardType="default"
          autoCapitalize="characters"
          editable={!isLoading && !revealedCharacters[index]}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onSubmitEditing={onSubmitEditing}
        />
      ))}
    </View>
  );
};

export default function SinglePlayerGame() {
  const router = useRouter();
  const { botStyle } = useLocalSearchParams<{ botStyle: string }>();
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
  const [isHintBoxVisible, setIsHintBoxVisible] = useState<boolean>(false);
  const [wordLength, setWordLength] = useState<number | null>(null);
  const [isWordLengthRevealed, setIsWordLengthRevealed] = useState<boolean>(false);
  const [revealedCharacters, setRevealedCharacters] = useState<{ [key: number]: string }>({});

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

  useEffect(() => {
    const initGame = async () => {
      try {
        const response = await fetch(`${serverUrl}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            mode: 'single',
            sessionId: sessionId,
            generateNewWord: 'true',
            botStyle: botStyle,
          }).toString(),
        });
        
        if (!response.ok) {
          throw new Error('Failed to initialize game');
        }
        
        const data = await response.json();
        console.log('Game initialized with bot style:', botStyle);
        // Don't update game UI here, as we haven't made a guess yet
      } catch (error) {
        console.error('Error initializing game:', error);
        Alert.alert('Error', 'Failed to start the game. Please try again.');
      }
    };

    initGame();
  }, [sessionId, botStyle]);

  const handleGuessSubmission = async () => {
    if (!userGuess.trim()) return;

    setIsLoading(true);
    setGuessCount(guessCount + 1);

    // Create a new guess that includes revealed characters
    const finalGuess = wordLength
      ? [...Array(wordLength)].map((_, index) => 
          revealedCharacters[index] || userGuess[index] || ''
        ).join('')
      : userGuess.trim();

    const postData: any = {
      userGuess: finalGuess,
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
    setWordLength(null); // Reset wordLength to null

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
    setIsHintBoxVisible(true);
  };

  const handleWordChanged = () => {
    // Reset game state
    setIsGameWon(false);
    setIsGameOver(false);
    setResponse('');
    setUserGuess('');
    setGuessCount(0);
    setHistory([]);
    setEmoji('');
    setFeedbackMessage('');
    setWordLength(null); // Reset wordLength to null
  };

  const handleRevealWordLength = async () => {
    console.log('Revealing word length');
    try {
      const postData = {
        sessionId: sessionId,
        mode: 'single',
      };

      const response = await fetch(`${serverUrl}/reveal-word-length`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(postData).toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to reveal word length');
      }

      const data = await response.json();
      if (data.success) {
        setWordLength(data.wordLength);
        Alert.alert('Word Length', `The secret word is ${data.wordLength} characters long.`);
      } else {
        throw new Error(data.message || 'Failed to reveal word length');
      }
    } catch (error) {
      console.error('Error revealing word length:', error);
      Alert.alert('Error', 'Failed to reveal the word length. Please try again.');
    }
  };

  const handleWordLengthRevealed = (length: number | null) => {
    setWordLength(length);
    setIsWordLengthRevealed(true);
  };

  const handleCharacterRevealed = (index: number, character: string) => {
    setRevealedCharacters(prev => ({ ...prev, [index]: character }));
  };

  const renderSendButton = () => {
    if (wordLength) {
      const filledCharacters = userGuess.length + Object.keys(revealedCharacters).length;
      const isGuessComplete = filledCharacters === wordLength;

      return (
        <CustomButton
          style={[
            styles.sendButtonRevealed,
            (!isGuessComplete || isLoading) && styles.disabledButton,
            { marginTop: 10 } // Add some space above the button
          ]}
          onPress={handleGuessSubmission}
          disabled={!isGuessComplete || isLoading}
        >
          <Send color="#1E2A3A" size={24} style={styles.sendButtonIcon} />
          <Text style={styles.sendButtonText}>Send</Text>
        </CustomButton>
      );
    } else {
      return (
        <CustomButton
          style={[styles.sendButton, (isLoading || isExceedingLimit || isExceedingSpaceLimit) && styles.disabledButton]}
          onPress={handleGuessSubmission}
          disabled={isLoading || isExceedingLimit || isExceedingSpaceLimit}
        >
          <Send color="#1E2A3A" size={24} />
        </CustomButton>
      );
    }
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
                {wordLength ? (
                  <>
                    <SeparatedInputBoxes
                      wordLength={wordLength}
                      userGuess={userGuess}
                      onChangeText={setUserGuess}
                      onSubmitEditing={handleGuessSubmission}
                      isLoading={isLoading}
                      revealedCharacters={revealedCharacters}
                    />
                    <View style={localStyles.revealedSendButtonContainer}>
                      {renderSendButton()}
                    </View>
                  </>
                ) : (
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
                    {renderSendButton()}
                  </View>
                )}
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
              <HintButton onPress={handleHintPress} />
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

        <HintBox
          isVisible={isHintBoxVisible}
          onClose={() => setIsHintBoxVisible(false)}
          sessionId={sessionId}
          onWordChanged={handleWordChanged}
          serverUrl={serverUrl}
          onWordLengthRevealed={handleWordLengthRevealed}
          isWordLengthRevealed={isWordLengthRevealed}
          onCharacterRevealed={handleCharacterRevealed}
        />
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  separatedInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  separatedInput: {
    borderWidth: 2,
    borderColor: '#4ECDC4',
    borderRadius: 10,
    textAlign: 'center',
    margin: 3,
    marginBottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  revealedSendButtonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  sendButtonRevealed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF69B4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  sendButtonIcon: {
    marginRight: 10,
  },
  sendButtonText: {
    color: '#1E2A3A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  revealedCharacter: {
    backgroundColor: '#2A3C50',
    borderColor: '#4ECDC4',
    color: '#FFFFFF',
  },
});
