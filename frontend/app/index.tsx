import React from 'react';
import { View, Text, SafeAreaView, Linking, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { UserCircle, Users, Coffee } from 'lucide-react-native';
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

  const openBuyMeACoffee = () => {
    Linking.openURL('https://www.buymeacoffee.com/beatthebot');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AnimatedBackground />
        {/* Add the robot image background */}
        <Image
          source={require('../assets/images/adaptive-icon.png')}
          style={{
            position: 'absolute',
            width: '50%',
            height: '50%',
            opacity: 0.1,
            alignSelf: 'center',
            // top: '5%',
          }}
          resizeMode="contain"
        />
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
                onPress={() => router.push('/single-player-setup')}
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
          
          {/* Buy Me a Coffee button */}
          <TouchableOpacity 
            onPress={openBuyMeACoffee}
            style={styles.buyMeCoffeeButton}
          >
            <Coffee 
              color={'black'} 
              size={20} 
              style={styles.buyMeCoffeeIcon} 
            />
            <Text style={styles.buyMeCoffeeText}>
              Buy me a coffee
            </Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}
