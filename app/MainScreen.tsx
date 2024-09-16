// MainScreen.tsx
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { NavigationProp } from '@react-navigation/native'; // Import NavigationProp
import styles from './styles'; // Make sure to import your styles

// Define the props type
type MainScreenProps = {
  navigation: NavigationProp<any>; // Specify the type for navigation
};

export default function MainScreen({ navigation }: MainScreenProps) { // Use the defined type
  return (
    <View style={styles.container}>
      <Text style={styles.mainHeader}>Word Guess</Text>
      <View style={styles.modeSelectionContainer}>
        <Text style={styles.heading}>Select Game Mode</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('SinglePlayer')}
          >
            <Text style={styles.buttonText}>Single Player</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('MultiPlayer')}
          >
            <Text style={styles.buttonText}>2-Player</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
