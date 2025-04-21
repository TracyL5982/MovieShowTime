import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioHandler } from './AudioHandler';
import { COLORS } from '../../styles/theme';

interface VoiceInputProps {
  onInputChange: (text: string) => void;
  onSubmit: () => void;
  isTyping: boolean;
  userInputText: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onInputChange,
  onSubmit,
  isTyping,
  userInputText,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Pulsing animation when recording
  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation;
    
    if (isRecording) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      
      pulseAnimation.start();
    }
    
    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
      pulseAnim.setValue(1);
    };
  }, [isRecording, pulseAnim]);

  // Start recording when the voice icon is pressed
  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      await AudioHandler.recorder.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  // Stop recording, transcribe audio, and update the input field
  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      setIsTranscribing(true);
      
      const audioUri = await AudioHandler.recorder.stopRecording();
      const transcribedText = await AudioHandler.transcribeAudio(audioUri);
      
      if (transcribedText) {
        onInputChange(transcribedText);
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (AudioHandler.recorder.isCurrentlyRecording()) {
        AudioHandler.recorder.cancelRecording();
      }
    };
  }, []);

  const renderButton = () => {
    if (isTyping || userInputText.trim() !== '') {
      return (
        <TouchableOpacity style={styles.iconButton} onPress={onSubmit}>
          <Ionicons name="arrow-up" size={24} color={COLORS.amazonBlue} />
        </TouchableOpacity>
      );
    } else if (isRecording) {
      return (
        <TouchableOpacity style={styles.iconButton} onPress={handleStopRecording}>
          <Animated.View
            style={[
              styles.recordingIndicator,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Ionicons name="mic" size={24} color="white" />
          </Animated.View>
        </TouchableOpacity>
      );
    } else if (isTranscribing) {
      return (
        <View style={styles.iconButton}>
          <ActivityIndicator size="small" color={COLORS.amazonBlue} />
        </View>
      );
    } else {
      return (
        <TouchableOpacity style={styles.iconButton} onPress={handleStartRecording}>
          <Ionicons name="mic" size={24} color={COLORS.amazonBlue} />
        </TouchableOpacity>
      );
    }
  };

  return <View style={styles.container}>{renderButton()}</View>;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.flamingOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VoiceInput; 