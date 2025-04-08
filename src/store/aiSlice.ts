import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AIState {
  isListening: boolean;
  transcript: string;
  response: string;
  isVisible: boolean;
  error: string | null;
}

const initialState: AIState = {
  isListening: false,
  transcript: '',
  response: '',
  isVisible: true,
  error: null,
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setListening: (state, action: PayloadAction<boolean>) => {
      state.isListening = action.payload;
    },
    setTranscript: (state, action: PayloadAction<string>) => {
      state.transcript = action.payload;
    },
    setResponse: (state, action: PayloadAction<string>) => {
      state.response = action.payload;
    },
    toggleVisibility: (state) => {
      state.isVisible = !state.isVisible;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const { setListening, setTranscript, setResponse, toggleVisibility, setError } = aiSlice.actions;
export default aiSlice.reducer; 