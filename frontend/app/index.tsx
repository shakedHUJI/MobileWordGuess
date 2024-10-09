import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles/styles';
import { useRouter } from 'expo-router';
import CustomButton from '../components/CustomButton';
import { UserCircle, Users } from 'lucide-react-native';

export default function MainScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#FFD700', '#FF69B4', '#4169E1']}
        style={styles.container}
      >
        <View style={styles.gameWrapper}>
          <Text style={styles.mainHeader}>Word Wizardry</Text>
          <View style={styles.modeSelectionContainer}>
            <Text style={styles.heading}>Choose Your Adventure</Text>
            <View style={styles.buttonContainer}>
              <CustomButton
                style={styles.button}
                onPress={() => router.push('/single-player')}
              >
                <UserCircle color="#FFFFFF" size={24} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Solo Quest</Text>
              </CustomButton>
            </View>
            <View style={styles.buttonContainer}>
              <CustomButton
                style={styles.button}
                onPress={() => router.push('/multi-player-selection')}
              >
                <Users color="#FFFFFF" size={24} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Wizard Duel</Text>
              </CustomButton>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}