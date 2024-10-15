// app/_layout.tsx

import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { View, Text } from 'react-native';
import styles from '../styles/styles';
import { WebSocketProvider } from './WebSocketProvider';
import SoundManager from '../SoundManager'; // Adjust the path accordingly
import ErrorBoundary from 'react-native-error-boundary';

const ErrorFallback = ({ error }: { error: Error }) => (
  <View style={styles.container}>
    <Text>An error occurred:</Text>
    <Text>{error.toString()}</Text>
  </View>
);

export default function RootLayout() {
  useEffect(() => {
    const initSound = async () => {
      const soundManager = SoundManager.getInstance();
      await soundManager.init();
    };
    initSound();

    return () => {
      // Unload the sound when the app unmounts
      const soundManager = SoundManager.getInstance();
      soundManager.unload();
    };
  }, []);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <WebSocketProvider>
        <View style={styles.container}>
          <Slot />
        </View>
      </WebSocketProvider>
    </ErrorBoundary>
  );
}
