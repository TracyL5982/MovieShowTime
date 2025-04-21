import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define cinema interface for structured data
export interface CinemaData {
  name: string;
  address?: string;
  description: string;
  url?: string;
  distance?: string;
}

export interface StructuredCinemaResponse {
  cinemas: CinemaData[];
}

// Define the message interface
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIState {
  isVisible: boolean;
  response: string | null;
  conversationHistory: ChatMessage[];
  chatboxHeight: number;
  structuredCinemaData: StructuredCinemaResponse | null;
}

const initialState: AIState = {
  isVisible: true,
  response: null,
  conversationHistory: [],
  chatboxHeight: 0,
  structuredCinemaData: null,
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setVisible: (state, action: PayloadAction<boolean>) => {
      state.isVisible = action.payload;
    },
    setResponse: (state, action: PayloadAction<string>) => {
      state.response = action.payload;
    },
    addMessageToHistory: (state, action: PayloadAction<ChatMessage>) => {
      state.conversationHistory.push(action.payload);
    },
    clearConversationHistory: (state) => {
      state.conversationHistory = [];
    },
    setChatboxHeight: (state, action: PayloadAction<number>) => {
      state.chatboxHeight = action.payload;
    },
    updateMessageInHistory: (state, action: PayloadAction<{ index: number, message: ChatMessage }>) => {
      const { index, message } = action.payload;
      if (index >= 0 && index < state.conversationHistory.length) {
        state.conversationHistory[index] = message;
      }
    },
    setStructuredCinemaData: (state, action: PayloadAction<StructuredCinemaResponse>) => {
      state.structuredCinemaData = action.payload;
    },
  },
});

export const { 
  setVisible, 
  setResponse, 
  addMessageToHistory, 
  clearConversationHistory,
  setChatboxHeight,
  updateMessageInHistory,
  setStructuredCinemaData
} = aiSlice.actions;

export default aiSlice.reducer; 