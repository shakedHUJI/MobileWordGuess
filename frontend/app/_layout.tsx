// app/_layout.tsx

import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { View } from 'react-native';
import styles from '../styles/styles';
import { WebSocketProvider } from './WebSocketProvider';
import SoundManager from '../SoundManager'; // Adjust the path accordingly

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
    <WebSocketProvider>
      <View style={styles.container}>
        <Slot />
      </View>
    </WebSocketProvider>
  );
}
