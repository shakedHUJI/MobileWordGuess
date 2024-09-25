// SoundManager.ts

import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

const clickSound = require('./assets/sounds/button-click2.mp3'); // Adjust the path accordingly

class SoundManager {
  private static instance: SoundManager;
  private sound: Audio.Sound | null = null;

  private constructor() {}

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  async init() {
    try {
      // Set the audio mode before loading sounds
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.sound = new Audio.Sound();
      await this.sound.loadAsync(clickSound);
      console.log('SoundManager: Sound loaded');

      // Optionally, you can check the status
      const status = await this.sound.getStatusAsync();
      console.log('SoundManager: Sound status after loading', status);
    } catch (error) {
      console.error('SoundManager: Error loading sound', error);
    }
  }

  async playClick() {
    try {
      if (this.sound) {
        const status = await this.sound.getStatusAsync();
        console.log('SoundManager: Sound status before playing', status);
        if (status.isLoaded) {
          await this.sound.replayAsync();
          console.log('SoundManager: Sound played');
        } else {
          console.log('SoundManager: Sound is not loaded');
        }
      } else {
        console.log('SoundManager: Sound object is null');
      }
    } catch (error) {
      console.error('SoundManager: Error playing sound', error);
    }
  }

  async unload() {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
      console.log('SoundManager: Sound unloaded');
    }
  }
}

export default SoundManager;
