import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { UserCircle, Users } from 'lucide-react-native';
import { MotiView } from 'moti';
import CustomButton from '../components/CustomButton';
import styles from '../styles/styles';

const AnimatedBackground = React.memo(() => {
  return (
    <>
      {[...Array(20)].map((_, index) => (
        <MotiView
          key={index}
          from={{
            opacity: 0,
            scale: 1,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [1, 1.5, 1],
          }}
          transition={{
            type: 'timing',
            duration: 3000,
            loop: true,
            delay: index * 200,
            repeatReverse: false,
          }}
          style={[
            styles.animatedBackground,
            {
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#00FFFF',
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            },
          ]}
        />
      ))}
    </>
  );
});

export default function MainScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AnimatedBackground />
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 1000 }}
          style={styles.gameWrapper}
        >
          <Text style={styles.mainHeader}>Beat the Bot</Text>
          <View style={{justifyContent: 'center', height: '80%'} }>
          <View style={styles.modeSelectionContainer}>
            <Text style={styles.heading}>Choose Your Challenge</Text>
            <View style={styles.buttonContainer}>
              <CustomButton
                style={styles.button}
                onPress={() => router.push('/single-player')}
              >
                <UserCircle color="#1E2A3A" size={24} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Single player</Text>
              </CustomButton>
            </View>
            <View style={styles.buttonContainer}>
              <CustomButton
                style={styles.button}
                onPress={() => router.push('/multi-player-selection')}
              >
                <Users color="#1E2A3A" size={24} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Play against friends</Text>
              </CustomButton>
            </View>
          </View>
          </View>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}
