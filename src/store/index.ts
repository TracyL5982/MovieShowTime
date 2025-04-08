import { configureStore } from '@reduxjs/toolkit';
import movieReducer from './movieSlice';
import aiReducer from './aiSlice';
import cinemaReducer from './cinemaSlice';
import { Movie, Cinema } from '../services';

interface MovieStateRef {
  movies: Movie[];
  selectedMovie: Movie | null;
  loading: boolean;
  error: string | null;
}

interface CinemaStateRef {
  cinemas: Cinema[];
  selectedCinema: Cinema | null;
  loading: boolean;
  error: string | null;
}

interface AIStateRef {
  query: string;
  response: string;
  thinking: boolean;
  error: string | null;
}

export const store = configureStore({
  reducer: {
    movies: movieReducer,
    ai: aiReducer,
    cinemas: cinemaReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 