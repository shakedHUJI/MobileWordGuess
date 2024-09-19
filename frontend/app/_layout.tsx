// app/_layout.tsx
import { Slot } from 'expo-router';
import { View } from 'react-native';
import styles from '../styles/styles';
import { WebSocketProvider } from './WebSocketProvider'; // Adjust the path accordingly

export default function RootLayout() {
  return (
    <WebSocketProvider>
      <View style={styles.container}>
        <Slot />
      </View>
    </WebSocketProvider>
  );
}
