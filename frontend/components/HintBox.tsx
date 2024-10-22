import React from 'react';
import { View, Text, Modal, TouchableOpacity, Alert } from 'react-native';
import { X, Eye, Ruler, RefreshCw } from 'lucide-react-native';
import styles from '../styles/styles';
import CustomButton from './CustomButton';

interface HintBoxProps {
  isVisible: boolean;
  onClose: () => void;
  sessionId: string;
  onWordChanged: () => void;
  serverUrl: string;
}

const HintBox: React.FC<HintBoxProps> = ({ isVisible, onClose, sessionId, onWordChanged, serverUrl }) => {
  const handleReplaceWord = async () => {
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
        Alert.alert('Success', 'The word has been replaced. Good luck!');
      } else {
        throw new Error(data.message || 'Failed to replace word');
      }
    } catch (error) {
      console.error('Error replacing word:', error);
      Alert.alert('Error', 'Failed to replace the word. Please try again.');
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
            <CustomButton style={styles.hintButton} onPress={() => {}}>
              <View style={styles.hintButtonContent}>
                <Eye color="#1E2A3A" size={24} style={styles.hintButtonIcon} />
                <Text style={styles.hintButtonText}>Reveal Character</Text>
              </View>
            </CustomButton>
            <CustomButton style={styles.hintButton} onPress={() => {}}>
              <View style={styles.hintButtonContent}>
                <Ruler color="#1E2A3A" size={24} style={styles.hintButtonIcon} />
                <Text style={styles.hintButtonText}>Reveal Word Length</Text>
              </View>
            </CustomButton>
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
