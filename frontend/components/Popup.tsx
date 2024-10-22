import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import styles from '../styles/styles';

interface PopupProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

const Popup: React.FC<PopupProps> = ({ isVisible, onClose, title, content }) => {
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
            <Text style={styles.popupTitle}>{title}</Text>
          </View>
          <ScrollView style={styles.popupContent}>
            {typeof content === 'string' ? (
              <Text style={styles.popupText}>{content}</Text>
            ) : (
              content
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default Popup;
