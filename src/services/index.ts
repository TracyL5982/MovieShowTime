import * as TMDbAPI from './tmdb';
import * as CinemaAPI from './cinema';
import * as LocationAPI from './location';
import { ShowtimeDetails, CinemaShowtimeInfo, MovieShowtimeAPI as OriginalMovieShowtimeAPI } from './movieShowtimeSearch';

export type { Movie } from './tmdb';
export type { Cinema, Showtime } from './cinema';
export type { UserLocation, GeocodeResult } from './location';
export type { FilmPerson } from './tmdb';
export type { ShowtimeDetails, CinemaShowtimeInfo } from './movieShowtimeSearch';

export const MovieAPI = {
  getMovies: async (): Promise<TMDbAPI.Movie[]> => {
    try {
      return await TMDbAPI.fetchNowPlayingMovies();
    } catch (error) {
      console.error('Error fetching movies:', error);
      return [];
    }
  },
  
  searchMovies: async (query: string): Promise<TMDbAPI.Movie[]> => {
    try {
      return await TMDbAPI.searchMovies(query);
    } catch (error) {
      console.error(`Error searching for movies with query: ${query}`, error);
      return [];
    }
  },
  
  getMovieDetails: async (movieId: number): Promise<any> => {
    try {
      return await TMDbAPI.fetchMovieDetails(movieId);
    } catch (error) {
      console.error(`Error fetching movie details for ${movieId}:`, error);
      return null;
    }
  },
};

export const CinemaAPI_Internal = {
  getNearbyCinemas: async (limit: number = 5): Promise<CinemaAPI.Cinema[]> => {
    try {
      return await CinemaAPI.getNearbyCinemas(limit);
    } catch (error) {
      console.error('Error fetching nearby cinemas:', error);
      return [];
    }
  },
  
  getCinema: async (cinemaId: string): Promise<CinemaAPI.Cinema | null> => {
    try {
      return await CinemaAPI.getCinemaById(cinemaId);
    } catch (error) {
      console.error(`Error fetching cinema ${cinemaId}:`, error);
      return null;
    }
  },
  
  getMoviesAtCinema: async (cinemaId: string): Promise<{[key: string]: CinemaAPI.Showtime[]}> => {
    try {
      const cinema = await CinemaAPI.getCinemaById(cinemaId);
      if (!cinema) {
        console.log(`Cinema with ID ${cinemaId} not found`);
        return {};
      }
      
      try {
        const showtimes = await CinemaAPI.getShowtimesForCinema(cinemaId);
        
        if (Object.keys(showtimes).length === 0) {
          console.log(`No showtimes found for cinema ${cinemaId}`);
          return {};
        }
        
        return showtimes;
      } catch (showtimesError) {
        console.error(`Error fetching showtimes for cinema ${cinemaId}:`, showtimesError);
        return {};
      }
    } catch (error) {
      console.error(`Error fetching movies at cinema ${cinemaId}:`, error);
      return {};
    }
  },
  
  getShowtimesForMovie: async (movieId: string): Promise<ShowtimeDetails[]> => {
    try {
      const showtimes = await CinemaAPI.getShowtimesForMovie(movieId);
      const movies = await TMDbAPI.fetchNowPlayingMovies();
      const movie = movies.find(m => m.id === movieId);
      
      if (!movie) {
        console.warn(`Movie with ID ${movieId} not found`);
        return [];
      }
      
      if (showtimes.length === 0) {
        console.log(`No showtimes found for movie ${movieId}`);
        return [];
      }
      
      return showtimes.map(showtime => ({
        id: showtime.id,
        movieId: showtime.movieId,
        movieTitle: movie?.title || 'Unknown Movie',
        theater: showtime.theater,
        theaterId: showtime.cinemaId,
        date: showtime.date,
        time: showtime.time,
        price: showtime.price.startsWith('$') ? showtime.price : `$${showtime.price}`,
        format: showtime.format
      }));
    } catch (error) {
      console.error(`Error fetching showtimes for movie ${movieId}:`, error);
      return [];
    }
  },
  
  getCinemasWithMovies: async (): Promise<CinemaAPI.Cinema[]> => {
    try {
      return await CinemaAPI.getCinemasWithMovies();
    } catch (error) {
      console.error('Error fetching cinemas with movies:', error);
      return [];
    }
  },
};

export const LocationService = {
  getUserLocation: async () => {
    try {
      return await LocationAPI.getCurrentLocation();
    } catch (error) {
      console.error('Error getting user location:', error);
      return null;
    }
  },
  
  calculateDistanceToUser: async (cinema: CinemaAPI.Cinema): Promise<number> => {
    try {
      const userLocation = await LocationAPI.getCurrentLocation();
      
      let userCoordinates;
      if (userLocation) {
        userCoordinates = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        };
      } else {
        userCoordinates = LocationAPI.DEFAULT_LOCATION;
      }
      
      const distance_km = LocationAPI.calculateDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        cinema.location.lat,
        cinema.location.lng
      );
      
      return LocationAPI.kmToMiles(distance_km);
    } catch (error) {
      console.error('Error calculating distance:', error);
      return 0;
    }
  },
};

// Combine all APIs into a single comprehensive MovieShowtimeAPI
export const MovieShowtimeAPI = {
  ...OriginalMovieShowtimeAPI,
  ...MovieAPI,
  ...CinemaAPI_Internal
}; 