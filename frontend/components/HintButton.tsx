import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import styles from '../styles/styles';

interface HintButtonProps {
  onPress: () => void;
}

const HintButton: React.FC<HintButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.bulbButton} onPress={onPress}>
      <Lightbulb color="#1E2A3A" size={24} />
    </TouchableOpacity>
  );
};


export default HintButton;
