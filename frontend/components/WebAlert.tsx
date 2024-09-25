import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/styles';

interface WebAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

const WebAlert: React.FC<WebAlertProps> = ({ visible, title, message, onClose }) => {
  if (!visible) return null;

  return (
    <Modal transparent={true} animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <TouchableOpacity style={styles.alertButton} onPress={onClose}>
            <Text style={styles.alertButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default WebAlert;