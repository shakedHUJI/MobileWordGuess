// app/index.tsx
import React from 'react';
import { View, Text} from 'react-native';
import styles from '../styles/styles';
import { useRouter } from 'expo-router';
import CustomButton from '../components/CustomButton';

export default function MainScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.mainHeader}>Word Guess</Text>
      <View style={styles.modeSelectionContainer}>
        <Text style={styles.heading}>Select Game Mode</Text>
        <View style={styles.buttonContainer}>
          <CustomButton
            style={styles.button}
            onPress={() => router.push('/single-player')}
          >
            <Text style={styles.buttonText}>Single Player</Text>
          </CustomButton>
        </View>
        <View style={styles.buttonContainer}>
          <CustomButton
            style={styles.button}
            onPress={() => router.push('/multi-player-selection')}
          >
            <Text style={styles.buttonText}>2-Player</Text>
          </CustomButton>
        </View>
      </View>
    </View>
  );
}
