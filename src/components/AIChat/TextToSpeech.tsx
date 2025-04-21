import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { COLORS } from '../../styles/theme';

interface TextToSpeechProps {
  text: string;
  size?: number;
  color?: string;
}

const TextToSpeech: React.FC<TextToSpeechProps> = ({
  text,
  size = 24,
  color = COLORS.amazonBlue,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
      }
    };
  }, [isSpeaking]);

  useEffect(() => {
    if (isSpeaking) {
      stopSpeaking();
    }
  }, [text]);

  const startSpeaking = async () => {
    try {
      if (isSpeaking) {
        await Speech.stop();
        setIsSpeaking(false);
        return;
      }

      setIsLoading(true);
      
      console.log("Starting text-to-speech with text length:", text?.length);
      
      if (!text || text.trim().length === 0) {
        console.error("Cannot speak empty text");
        setIsLoading(false);
        return;
      }

      const isCurrentlySpeaking = await Speech.isSpeakingAsync();
      console.log("Speech is currently active:", isCurrentlySpeaking);
      
      if (isCurrentlySpeaking) {
        await Speech.stop();
      }

      Speech.speak(text, {
        language: 'en-US',
        rate: Platform.OS === 'ios' ? 0.5 : 0.95, 
        pitch: 1.0, 
        onStart: () => {
          console.log("Speech started successfully");
          setIsLoading(false);
          setIsSpeaking(true);
        },
        onDone: () => {
          console.log("Speech completed");
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setIsSpeaking(false);
          setIsLoading(false);
        },
        onStopped: () => {
          console.log("Speech stopped");
          setIsSpeaking(false);
        }
      });
    } catch (error) {
      console.error('Failed to start speaking:', error);
      setIsSpeaking(false);
      setIsLoading(false);
    }
  };

  const stopSpeaking = async () => {
    try {
      console.log("Stopping speech");
      await Speech.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Failed to stop speaking:', error);
      setIsSpeaking(false);
    }
  };

  const renderIcon = () => {
    if (isLoading) {
      return <ActivityIndicator size="small" color={color} />;
    } else if (isSpeaking) {
      return <Ionicons name="stop-circle" size={size + 4} color={COLORS.flamingOrange} />;
    } else {
      return <Ionicons name="volume-high" size={size} color={color} />;
    }
  };

  return (
    <TouchableOpacity
      style={styles.iconButton}
      onPress={isSpeaking ? stopSpeaking : startSpeaking}
      disabled={isLoading}
    >
      {renderIcon()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TextToSpeech; 