import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MovieShowtimeAPI } from '../services';
import { Movie } from '../services/tmdb';

// Define a local type for the state shape to avoid circular imports
interface RootStateShape {
  movies: {
    movies: Movie[];
    searchResults: Movie[];
  };
}

interface MovieState {
  movies: Movie[];
  searchResults: Movie[];
  selectedMovie: Movie | null;
  loading: boolean;
  error: string | null;
}

const initialState: MovieState = {
  movies: [],
  searchResults: [],
  selectedMovie: null,
  loading: false,
  error: null,
};

// Track last fetch time to prevent excessive API calls
let lastFetchTime = 0;
const FETCH_THROTTLE_MS = 5000; // 5 seconds

export const fetchMovies = createAsyncThunk(
  'movies/fetchMovies',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootStateShape;
      
      // If we already have movies and it hasn't been long enough since last fetch, use existing data
      const now = Date.now();
      if (state.movies.movies.length > 0 && (now - lastFetchTime < FETCH_THROTTLE_MS)) {
        console.log('Using cached movies (throttled)');
        return state.movies.movies;
      }
      
      console.log('Fetching movies using TMDb API');
      lastFetchTime = now;
      return await MovieShowtimeAPI.getMovies();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchMovies = createAsyncThunk(
  'movies/searchMovies',
  async (query: string, { rejectWithValue, dispatch }) => {
    try {
      console.log(`Searching for movies with query: ${query}`);
      const results = await MovieShowtimeAPI.searchMovies(query);
      
      // Store the results for this specific query
      dispatch(addSearchResults(results));
      
      // Return the results for this specific query
      return results;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const movieSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    setMovies: (state, action: PayloadAction<Movie[]>) => {
      state.movies = action.payload;
    },
    setSelectedMovie: (state, action: PayloadAction<Movie>) => {
      state.selectedMovie = action.payload;
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
    // Add search results to the accumulated list
    addSearchResults: (state, action: PayloadAction<Movie[]>) => {
      // To avoid duplicates, we filter out existing movies by ID
      const newMovies = action.payload.filter(newMovie => 
        !state.searchResults.some(existingMovie => existingMovie.id === newMovie.id)
      );
      state.searchResults = [...state.searchResults, ...newMovies];
    },
    // Clear search results when starting a new search session
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMovies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.movies = action.payload;
        state.loading = false;
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(searchMovies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchMovies.fulfilled, (state, action) => {
        state.movies = action.payload; // Keep this for backward compatibility
        state.loading = false;
      })
      .addCase(searchMovies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setMovies, 
  setSelectedMovie, 
  setLoading, 
  setError, 
  clearError, 
  addSearchResults, 
  clearSearchResults 
} = movieSlice.actions;

export default movieSlice.reducer; 