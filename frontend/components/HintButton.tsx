import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Lightbulb } from 'lucide-react-native';

interface HintButtonProps {
  onPress: () => void;
}

const HintButton: React.FC<HintButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Lightbulb color="#1E2A3A" size={24} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#40798C',
    borderRadius: 50,
    padding: 10,
    marginLeft: 10,
  },
});

export default HintButton;
