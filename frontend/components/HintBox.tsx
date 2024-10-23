import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Alert, Platform } from 'react-native';
import { X, Eye, Ruler, RefreshCw } from 'lucide-react-native';
import styles from '../styles/styles';
import CustomButton from './CustomButton';

interface HintBoxProps {
  isVisible: boolean;
  onClose: () => void;
  sessionId: string;
  onWordChanged: () => void;
  serverUrl: string;
  onWordLengthRevealed: (length: number | null) => void;
  isWordLengthRevealed: boolean;
  onCharacterRevealed: (index: number, character: string) => void;
  revealedCharCount: number;
  maxReveals: number;
}

const HintBox: React.FC<HintBoxProps> = ({
  isVisible,
  onClose,
  sessionId,
  onWordChanged,
  serverUrl,
  onWordLengthRevealed,
  isWordLengthRevealed,
  onCharacterRevealed,
  revealedCharCount,
  maxReveals,
}) => {
  const [wordLength, setWordLength] = useState<number | null>(null);

  // Reset internal state when isWordLengthRevealed changes
  useEffect(() => {
    if (!isWordLengthRevealed) {
      setWordLength(null);
    }
  }, [isWordLengthRevealed]);

  const handleReplaceWord = () => {
    console.log('Replacing word');
    const confirmMessage = "Are you sure you want to switch the secret word?";

    if (Platform.OS === 'web') {
      const shouldReplace = confirm(confirmMessage);
      if (shouldReplace) {
        replaceWord();
      }
    } else {
      Alert.alert(
        "Confirm",
        confirmMessage,
        [
          { text: "Cancel", style: "cancel" },
          { text: "OK", onPress: () => replaceWord() }
        ],
        { cancelable: false }
      );
    }
  };

  const replaceWord = async () => {
    try {
      const postData = {
        sessionId: sessionId,
        mode: 'single',
        replaceWord: 'true',
      };

      const response = await fetch(`${serverUrl}/replace-word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(postData).toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to replace word');
      }

      const data = await response.json();
      if (data.success) {
        onWordChanged();
        setWordLength(null);
        Alert.alert('Success', 'The word has been replaced. Good luck!');
      } else {
        throw new Error(data.message || 'Failed to replace word');
      }
    } catch (error) {
      console.error('Error replacing word:', error);
      Alert.alert('Error', 'Failed to replace the word. Please try again.');
    }
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
        onWordLengthRevealed(data.wordLength);
        Alert.alert('Word Length', `The secret word is ${data.wordLength} characters long.`);
      } else {
        throw new Error(data.message || 'Failed to reveal word length');
      }
    } catch (error) {
      console.error('Error revealing word length:', error);
      Alert.alert('Error', 'Failed to reveal the word length. Please try again.');
    }
  };

  const handleRevealCharacter = async () => {
    if (revealedCharCount >= maxReveals) {
      Alert.alert('Hint Limit Reached', 'You have used the maximum number of character reveals for this word.');
      return;
    }

    console.log('Revealing character');
    try {
      const postData = {
        sessionId: sessionId,
        mode: 'single',
      };

      const response = await fetch(`${serverUrl}/reveal-character`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(postData).toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to reveal character');
      }

      const data = await response.json();
      if (data.success) {
        onCharacterRevealed(data.index, data.character);
        Alert.alert('Character Revealed', `The character at position ${data.index + 1} is "${data.character}".`);
      } else {
        throw new Error(data.message || 'Failed to reveal character');
      }
    } catch (error) {
      console.error('Error revealing character:', error);
      Alert.alert('Error', 'Failed to reveal the character. Please try again.');
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.popupContainer}>
          <View style={styles.closeButtonContainer}>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton]}>
              <X color="#1E2A3A" size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.popupHeader}>
            <Text style={styles.popupTitle}>Hint Options</Text>
          </View>
          <View style={styles.hintButtonContainer}>
            {/* Reveal Word Length button */}
            <CustomButton
              style={[styles.hintButton, isWordLengthRevealed && styles.disabledButton]}
              onPress={handleRevealWordLength}
              disabled={isWordLengthRevealed}
            >
              <View style={styles.hintButtonContent}>
                <Ruler color="#1E2A3A" size={24} style={styles.hintButtonIcon} />
                <Text style={styles.hintButtonText}>Reveal Word Length</Text>
              </View>
            </CustomButton>

            {/* Reveal Character button */}
            <CustomButton
              style={[
                styles.hintButton,
                (!isWordLengthRevealed || revealedCharCount >= maxReveals) && styles.disabledButton
              ]}
              onPress={handleRevealCharacter}
              disabled={!isWordLengthRevealed || revealedCharCount >= maxReveals}
            >
              <View style={styles.hintButtonContent}>
                <Eye color="#1E2A3A" size={24} style={styles.hintButtonIcon} />
                <Text style={styles.hintButtonText}>
                  Reveal Character ({revealedCharCount}/{maxReveals})
                </Text>
              </View>
            </CustomButton>

            {/* Replace Word button */}
            <CustomButton style={styles.hintButton} onPress={handleReplaceWord}>
              <View style={styles.hintButtonContent}>
                <RefreshCw color="#1E2A3A" size={24} style={styles.hintButtonIcon} />
                <Text style={styles.hintButtonText}>Replace Word</Text>
              </View>
            </CustomButton>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default HintBox;
