import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MovieShowtimeAPI, Cinema } from '../services';

interface CinemaState {
  cinemas: Cinema[];
  selectedCinema: Cinema | null;
  loading: boolean;
  error: string | null;
}

const initialState: CinemaState = {
  cinemas: [],
  selectedCinema: null,
  loading: false,
  error: null,
};

// Modified to use AI-based cinema search instead of mock data
export const fetchCinemas = createAsyncThunk<Cinema[], number>(
  'cinemas/fetchCinemas',
  async (limit: number = 5, { rejectWithValue }) => {
    try {
      console.log('This functionality has been replaced by AI-based cinema search');
      // Return empty array since the mock data function was removed
      // In the actual app, cinema data comes from AI search responses
      return [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCinema = createAsyncThunk<Cinema | null, string>(
  'cinemas/fetchCinema',
  async (cinemaId: string, { rejectWithValue }) => {
    try {
      console.log(`This functionality has been replaced by AI-based cinema search`);
      // Return null since the mock data function was removed
      // In the actual app, cinema data comes from AI search responses
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const cinemaSlice = createSlice({
  name: 'cinemas',
  initialState,
  reducers: {
    setCinemas: (state, action: PayloadAction<Cinema[]>) => {
      state.cinemas = action.payload;
    },
    setSelectedCinema: (state, action: PayloadAction<Cinema>) => {
      state.selectedCinema = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCinemas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCinemas.fulfilled, (state, action) => {
        state.cinemas = action.payload;
        state.loading = false;
      })
      .addCase(fetchCinemas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCinema.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCinema.fulfilled, (state, action) => {
        state.selectedCinema = action.payload;
        state.loading = false;
      })
      .addCase(fetchCinema.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCinemas, setSelectedCinema, setLoading, setError, clearError } = cinemaSlice.actions;
export default cinemaSlice.reducer; 