import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import styles from './styles'; // Assume shared styles

export default function SinglePlayerScreen() {
  const [userGuess, setUserGuess] = useState('');
  const [response, setResponse] = useState('');
  const [guessCount, setGuessCount] = useState(0);
  const [isGameWon, setIsGameWon] = useState(false);
  const confettiRef = useRef<ConfettiCannon | null>(null); // Specify the type for the ref

  const handleGuessSubmission = async () => {
    if (!userGuess.trim()) return;

    setGuessCount(guessCount + 1);
    
    // Make API call to submit guess for single player
    try {
      const response = await fetch(`http://192.168.1.246:3000/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          userGuess: userGuess.trim(),
          mode: 'single',
        }).toString(),
      });

      const data = await response.json();
      setResponse(data.response);

      if (data.response.includes('Congratulations!')) {
        setIsGameWon(true);
        confettiRef.current?.start(); // Use optional chaining
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit your guess.');
    }

    setUserGuess('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainHeader}>Single Player Mode</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your guess"
        placeholderTextColor="#888"
        value={userGuess}
        onChangeText={setUserGuess}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleGuessSubmission}>
          <Text style={styles.buttonText}>Submit Guess</Text>
        </TouchableOpacity>
      </View>

      {response && (
        <ScrollView style={styles.responseContainer}>
          <Text style={styles.responseText}>
            <Text style={styles.boldText}>Response:</Text> {response}
          </Text>
        </ScrollView>
      )}

      {isGameWon && (
        <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} fadeOut={true} ref={confettiRef} />
      )}
    </View>
  );
}
