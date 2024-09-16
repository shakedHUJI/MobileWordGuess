// MainScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/styles';

export default function MainScreen({ navigation }: { navigation: any }) {  return (
    <View style={styles.container}>
      <Text style={styles.mainHeader}>Word Guess</Text>
      <View style={styles.modeSelectionContainer}>
        <Text style={styles.heading}>Select Game Mode</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('SinglePlayerGame')}
          >
            <Text style={styles.buttonText}>Single Player</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('MultiPlayerGame')}
          >
            <Text style={styles.buttonText}>2-Player</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
