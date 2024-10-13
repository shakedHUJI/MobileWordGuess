import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

interface AnimatedEmojiBackgroundProps {
  emoji: string;
  visible: boolean;
}

const { width, height } = Dimensions.get('window');
const EMOJI_SIZE = 40;
const EMOJI_MARGIN = 5;
const EMOJIS_PER_ROW = Math.floor(width / (EMOJI_SIZE + EMOJI_MARGIN * 2));
const ROWS = Math.ceil(height / (EMOJI_SIZE + EMOJI_MARGIN * 2));
const TOTAL_EMOJIS = EMOJIS_PER_ROW * ROWS;

const AnimatedEmojiBackground: React.FC<AnimatedEmojiBackgroundProps> = ({ emoji, visible }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [fadeOutTrigger, setFadeOutTrigger] = useState(false);

  useEffect(() => {
    if (visible) {
      // First fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000, // Slow fade-in
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start(() => {
        // Hold for 2 seconds, then trigger fade-out
        setTimeout(() => setFadeOutTrigger(true), 2000);
      });
    }
  }, [visible]);

  useEffect(() => {
    if (fadeOutTrigger) {
      // Then fade out after the trigger
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 2000, // Smooth fade-out
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }).start(() => {
        // Reset the fadeOutTrigger for future animations
        setFadeOutTrigger(false);
      });
    }
  }, [fadeOutTrigger]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim,
        }
      ]}
    >
      {[...Array(TOTAL_EMOJIS)].map((_, index) => (
        <Text key={index} style={styles.emoji}>
          {emoji}
        </Text>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  emoji: {
    fontSize: EMOJI_SIZE,
    margin: EMOJI_MARGIN,
  },
});

export default AnimatedEmojiBackground;
