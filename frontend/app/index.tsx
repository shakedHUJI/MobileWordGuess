// app/index.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/styles';
import { useRouter } from 'expo-router';

export default function MainScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.mainHeader}>Word Guess</Text>
      <View style={styles.modeSelectionContainer}>
        <Text style={styles.heading}>Select Game Mode</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/single-player')}
          >
            <Text style={styles.buttonText}>Single Player</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/multi-player-selection')}
          >
            <Text style={styles.buttonText}>2-Player</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
