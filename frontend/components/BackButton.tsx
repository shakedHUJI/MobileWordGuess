import React from 'react';
import { useRouter } from 'expo-router';
import CustomButton from './CustomButton';
import { ArrowLeft } from 'lucide-react-native';
import styles from '../styles/styles';

interface BackButtonProps {
  shouldConfirm: boolean;
  goToIndex?: boolean;
  confirmMessage?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  shouldConfirm, 
  goToIndex = false, 
  confirmMessage = "Are you sure you want to quit? Your progress will be lost."
}) => {
  const router = useRouter();

  const handleBackPress = () => {
    if (shouldConfirm) {
      const shouldQuit = confirm(confirmMessage);
      if (!shouldQuit) return;
    }
    
    if (goToIndex) {
      router.navigate('/');
    } else {
      router.back();
    }
  };

  return (
    <CustomButton
      style={styles.backButton}
      onPress={handleBackPress}
    >
      <ArrowLeft color="#00FFFF" size={24} />
    </CustomButton>
  );
};

export default BackButton;
