// components/CustomButton.tsx

import React from 'react';
import { GestureResponderEvent, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import SoundManager from '../SoundManager'; // Adjust the path accordingly

export default function CustomButton(props: TouchableOpacityProps) {
  const handlePress = async (event: GestureResponderEvent) => {
    console.log('Button pressed');
    const soundManager = SoundManager.getInstance();
    soundManager.playClick();

    if (props.onPress) {
      props.onPress(event);
    }
  };

  return (
    <TouchableOpacity {...props} onPress={handlePress} activeOpacity={0.7}>
      {props.children}
    </TouchableOpacity>
  );
}
