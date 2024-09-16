// app/_layout.tsx
import { Slot } from 'expo-router';
import { View } from 'react-native';
import styles from '../styles/styles';

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <Slot />
    </View>
  );
}
