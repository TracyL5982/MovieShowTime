import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MovieShowtimeAPI } from '../services';
import { Cinema } from '../services';

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

export const fetchCinemas = createAsyncThunk(
  'cinemas/fetchCinemas',
  async (limit: number = 5, { rejectWithValue }) => {
    try {
      console.log('Fetching cinemas using our location-based service');
      return await MovieShowtimeAPI.getNearbyCinemas(limit);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCinema = createAsyncThunk(
  'cinemas/fetchCinema',
  async (cinemaId: string, { rejectWithValue }) => {
    try {
      console.log(`Fetching cinema details for ID: ${cinemaId}`);
      return await MovieShowtimeAPI.getCinema(cinemaId);
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