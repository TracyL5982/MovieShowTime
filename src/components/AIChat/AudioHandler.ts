import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import OpenAI from 'openai';
import { OPENAI_CONFIG } from '../../config/apiKeys';
import { Platform } from 'react-native';

// Initialize OpenAI client
const openai = new OpenAI(OPENAI_CONFIG);

// Audio recording config for Android
const ANDROID_RECORDING_OPTIONS = {
  extension: '.mp3',
  outputFormat: Audio.AndroidOutputFormat.MPEG_4,
  audioEncoder: Audio.AndroidAudioEncoder.AAC,
  sampleRate: 44100,
  numberOfChannels: 2,
  bitRate: 128000,
};

// Audio recording config for iOS
const IOS_RECORDING_OPTIONS = {
  extension: '.wav',
  audioQuality: Audio.IOSAudioQuality.HIGH,
  sampleRate: 44100,
  numberOfChannels: 2,
  bitRate: 128000,
  linearPCMBitDepth: 16,
  linearPCMIsBigEndian: false,
  linearPCMIsFloat: false,
};

// Complete recording options object
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: ANDROID_RECORDING_OPTIONS,
  ios: IOS_RECORDING_OPTIONS,
  web: {},
};

/**
 * Handles audio recording functionality
 */
class AudioRecorder {
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    try {
      console.log('Requesting audio recording permissions...');
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.error('Audio recording permissions not granted');
        throw new Error('Audio recording permissions not granted');
      }

      console.log('Setting up audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
      });

      console.log('Creating new recording...');
      this.recording = new Audio.Recording();
      
      await this.recording.prepareToRecordAsync(RECORDING_OPTIONS);
      await this.recording.startAsync();
      this.isRecording = true;
      console.log('Recording started on', Platform.OS);
    } catch (error) {
      console.error('Failed to start recording', error);
      throw error;
    }
  }

  /**
   * Stop recording and return the audio file URI
   */
  async stopRecording(): Promise<string> {
    if (!this.recording) {
      console.warn('No active recording to stop');
      throw new Error('No active recording to stop');
    }

    try {
      console.log('Stopping recording...');
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.isRecording = false;
      this.recording = null;
      
      if (!uri) {
        throw new Error('No recording URI available');
      }
      
      console.log('Recording stopped, URI:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording', error);
      throw error;
    }
  }

  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Cancel the current recording
   */
  async cancelRecording(): Promise<void> {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
        this.isRecording = false;
        this.recording = null;
        console.log('Recording cancelled');
      } catch (error) {
        console.error('Failed to cancel recording', error);
      }
    }
  }
}

/**
 * Determine the audio format from the URI
 */
function getAudioFormat(uri: string): string {
  const lowerCaseUri = uri.toLowerCase();
  if (lowerCaseUri.endsWith('.wav')) return 'wav';
  if (lowerCaseUri.endsWith('.mp3')) return 'mp3';
  if (lowerCaseUri.endsWith('.m4a')) return 'mp3'; // Use mp3 for m4a (OpenAI accepts mp3)
  if (lowerCaseUri.endsWith('.aac')) return 'mp3'; // Use mp3 for aac
  
  // Default based on platform
  return Platform.OS === 'ios' ? 'wav' : 'mp3';
}

/**
 * Get the appropriate MIME type for the audio file
 */
function getAudioMimeType(format: string): string {
  switch (format) {
    case 'wav': return 'audio/wav';
    case 'mp3': return 'audio/mpeg';
    default: return 'audio/mpeg';
  }
}

/**
 * Transcribe audio file to text using OpenAI Whisper API
 */
async function transcribeAudio(audioUri: string): Promise<string> {
  try {
    console.log('Starting audio transcription...');
    
    // Create form data for the audio file
    const formData = new FormData();
    
    // Determine format based on file extension
    const format = getAudioFormat(audioUri);
    const mimeType = getAudioMimeType(format);
    
    console.log(`Audio format: ${format}, MIME type: ${mimeType}`);
    
    // Add the audio file to the form data
    formData.append('file', {
      uri: audioUri,
      type: mimeType,
      name: `recording.${format}`
    } as any);
    
    formData.append('model', 'whisper-1');
    
    // Get the API key from OPENAI_CONFIG
    const apiKey = OPENAI_CONFIG.apiKey;

    console.log('Sending transcription request to OpenAI...');
    
    // Make direct fetch request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    const transcribedText = data.text || '';
    
    console.log('Transcription completed:', transcribedText);
    return transcribedText;
  } catch (error) {
    console.error('Transcription failed:', error);
    throw error;
  }
}

/**
 * Convert file to base64
 */
async function fileToBase64(uri: string): Promise<string> {
  try {
    const fileContent = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return fileContent;
  } catch (error) {
    console.error('Error converting file to base64:', error);
    throw error;
  }
}

// Export all functionality
export const AudioHandler = {
  recorder: new AudioRecorder(),
  transcribeAudio,
}; 