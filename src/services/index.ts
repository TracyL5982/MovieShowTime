import * as TMDbAPI from './tmdb';
import * as LocationAPI from './location';
import { ShowtimeDetails, CinemaShowtimeInfo, MovieShowtimeAPI as OriginalMovieShowtimeAPI, Cinema } from './movieShowtimeSearch';

export type { Movie } from './tmdb';
export type { Cinema } from './movieShowtimeSearch';
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

export const LocationService = {
  getUserLocation: async () => {
    try {
      return await LocationAPI.getCurrentLocation();
    } catch (error) {
      console.error('Error getting user location:', error);
      return null;
    }
  },
  
  calculateDistanceToUser: async (cinema: Cinema): Promise<number> => {
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

// Update MovieShowtimeAPI to only include OriginalMovieShowtimeAPI and MovieAPI
export const MovieShowtimeAPI = {
  ...OriginalMovieShowtimeAPI,
  ...MovieAPI
}; 