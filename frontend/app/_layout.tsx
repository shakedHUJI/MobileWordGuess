// app/_layout.tsx

import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { View, Text, I18nManager } from 'react-native';
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
    if (I18nManager.isRTL) {
      I18nManager.allowRTL(false);
      I18nManager.forceRTL(false);
    }

    const initSound = async () => {
      const soundManager = SoundManager.getInstance();
      await soundManager.init();
    };
    initSound();

    return () => {
      const soundManager = SoundManager.getInstance();
      soundManager.unload();
    };
  }, []);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <WebSocketProvider>
        <View style={[styles.container, { direction: 'ltr' }]}>
          <Slot />
        </View>
      </WebSocketProvider>
    </ErrorBoundary>
  );
}
