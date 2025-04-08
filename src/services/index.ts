import * as TMDbAPI from './tmdb';
import * as CinemaAPI from './cinema';
import * as LocationAPI from './location';

export type { Movie } from './tmdb';
export type { Cinema, Showtime } from './cinema';
export type { UserLocation, GeocodeResult } from './location';

export interface ShowtimeDetails {
  id: string;
  movieId: string;
  movieTitle: string;
  theater: string;
  theaterId: string;
  date: string;
  time: string;
  price: string;
  format?: string;
  distance?: string;
}

const getCinemaNameById = (cinemaId: string): string => {
  const knownCinemas: {[key: string]: string} = {
    'AMC-Empire25': 'AMC Empire 25',
    'Regal-UnionSquare': 'Regal Union Square',
    'AMC-Lincoln': 'AMC Lincoln Square 13',
    'Chinese-TCL': 'TCL Chinese Theatre',
    'Regal-LA-Live': 'Regal LA Live',
    'AMC-Century-City': 'AMC Century City 15',
    'AMC-River-East': 'AMC River East 21',
    'AMC-NEWCITY': 'AMC NEWCITY 14',
    'AMC-Metreon': 'AMC Metreon 16',
    'Alamo-Mission': 'Alamo Drafthouse New Mission'
  };
  
  return knownCinemas[cinemaId] || `Cinema ${cinemaId}`;
};

// Given cinema and movie 
const generateFallbackShowtimes = (cinemaId: string, movieId: string, cinemaName: string): CinemaAPI.Showtime[] => {
  const showtimes: CinemaAPI.Showtime[] = [];
  const formats = ['Standard', 'IMAX', '3D', 'Dolby Atmos'];
  const startTimes = ['10:00', '12:30', '15:00', '17:30', '20:00', '22:30'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    
    const numTimes = Math.floor(Math.random() * 2) + 2;
    const dailyTimes = [...startTimes].sort(() => 0.5 - Math.random()).slice(0, numTimes);
    
    dailyTimes.forEach(time => {
      const format = formats[Math.floor(Math.random() * formats.length)];
      let price = 12.99;
      
      if (format === 'IMAX') price = 16.99;
      else if (format === '3D' || format === 'Dolby Atmos') price = 14.99;
      
      showtimes.push({
        id: `fallback-${cinemaId}-${movieId}-${dateString}-${time}`,
        movieId,
        cinemaId,
        time,
        date: dateString,
        price: `$${price.toFixed(2)}`,
        format,
        theater: cinemaName
      });
    });
  }
  return showtimes;
};

//Given movie only
const generateFallbackMovieShowtimes = (movieId: string, movieTitle?: string): ShowtimeDetails[] => {
  const showtimes: ShowtimeDetails[] = [];
  const cinemas = [
    { id: 'AMC-Empire25', name: 'AMC Empire 25' },
    { id: 'Regal-UnionSquare', name: 'Regal Union Square' },
    { id: 'AMC-Lincoln', name: 'AMC Lincoln Square 13' },
    { id: 'Chinese-TCL', name: 'TCL Chinese Theatre' }
  ];
  
  const formats = ['Standard', 'IMAX', '3D', 'Dolby Atmos'];
  const startTimes = ['10:00', '12:30', '15:00', '17:30', '20:00', '22:30'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];

    cinemas.forEach(cinema => {
      const numTimes = Math.floor(Math.random() * 2) + 2;
      const cinemaTimes = [...startTimes].sort(() => 0.5 - Math.random()).slice(0, numTimes);
      
      cinemaTimes.forEach(time => {
        // Random format and price
        const format = formats[Math.floor(Math.random() * formats.length)];
        let price = 12.99;
        
        if (format === 'IMAX') price = 16.99;
        else if (format === '3D' || format === 'Dolby Atmos') price = 14.99;
        
        showtimes.push({
          id: `fallback-${cinema.id}-${movieId}-${dateString}-${time}`,
          movieId,
          movieTitle: movieTitle || 'Unknown Movie',
          theater: cinema.name,
          theaterId: cinema.id,
          date: dateString,
          time,
          price: `$${price.toFixed(2)}`,
          format,
          distance: `${(Math.random() * 10).toFixed(1)} miles`
        });
      });
    });
  }
  
  return showtimes;
};


export const MovieShowtimeAPI = {

 //Get currently playing movies from TMDb
  getMovies: async (): Promise<TMDbAPI.Movie[]> => {
    try {
      return await TMDbAPI.fetchNowPlayingMovies();
    } catch (error) {
      console.error('Error fetching movies:', error);
      return [];
    }
  },
  
  // Get movie details from TMDb
  getMovieDetails: async (movieId: number): Promise<any> => {
    try {
      return await TMDbAPI.fetchMovieDetails(movieId);
    } catch (error) {
      console.error(`Error fetching movie details for ${movieId}:`, error);
      return null;
    }
  },
  
  //Get nearby cinemas based on user's location
  getNearbyCinemas: async (limit: number = 5): Promise<CinemaAPI.Cinema[]> => {
    try {
      return await CinemaAPI.getNearbyCinemas(limit);
    } catch (error) {
      console.error('Error fetching nearby cinemas:', error);
      return [];
    }
  },
  
  //get Cinema by ID
  getCinema: async (cinemaId: string): Promise<CinemaAPI.Cinema | null> => {
    try {
      return await CinemaAPI.getCinemaById(cinemaId);
    } catch (error) {
      console.error(`Error fetching cinema ${cinemaId}:`, error);
      return null;
    }
  },
  
  //get movies at a given cinema
  getMoviesAtCinema: async (cinemaId: string): Promise<{[key: string]: CinemaAPI.Showtime[]}> => {
    try {
      // First try to get the showtimes
      const showtimes = await CinemaAPI.getShowtimesForCinema(cinemaId);
      
      // If we got an empty object, try to generate fallback data
      if (Object.keys(showtimes).length === 0) {
        console.log(`No showtimes found for cinema ${cinemaId}, generating fallback data`);
        const movies = await TMDbAPI.fetchNowPlayingMovies();
        const cinemaName = getCinemaNameById(cinemaId);
        
        const fallbackShowtimes: {[key: string]: CinemaAPI.Showtime[]} = {};
        movies.slice(0, 5).forEach(movie => {
          fallbackShowtimes[movie.id] = generateFallbackShowtimes(cinemaId, movie.id, cinemaName);
        });
        
        return fallbackShowtimes;
      }
      
      return showtimes;
    } catch (error) {
      console.error(`Error fetching movies at cinema ${cinemaId}:`, error);
      
      // Generate fallback data
      const movies = await TMDbAPI.fetchNowPlayingMovies().catch(() => []);
      if (movies.length === 0) return {};
      
      const cinemaName = getCinemaNameById(cinemaId);
      
      const fallbackShowtimes: {[key: string]: CinemaAPI.Showtime[]} = {};
      movies.slice(0, 5).forEach(movie => {
        fallbackShowtimes[movie.id] = generateFallbackShowtimes(cinemaId, movie.id, cinemaName);
      });
      
      return fallbackShowtimes;
    }
  },
  
  //get showtimes for a given movie
  getShowtimesForMovie: async (movieId: string): Promise<ShowtimeDetails[]> => {
    try {
      const showtimes = await CinemaAPI.getShowtimesForMovie(movieId);
      const movies = await TMDbAPI.fetchNowPlayingMovies();
      const movie = movies.find(m => m.id === movieId);
      
      if (!movie) {
        console.warn(`Movie with ID ${movieId} not found, using fallback data`);
        return generateFallbackMovieShowtimes(movieId);
      }
      
      // If no showtimes were returned, generate fallback data
      if (showtimes.length === 0) {
        console.log(`No showtimes found for movie ${movieId}, generating fallback data`);
        return generateFallbackMovieShowtimes(movieId, movie.title);
      }
      
      // Map to showtimes to include movie title and other details
      return showtimes.map(showtime => ({
        id: showtime.id,
        movieId: showtime.movieId,
        movieTitle: movie?.title || 'Unknown Movie',
        theater: showtime.theater,
        theaterId: showtime.cinemaId,
        date: showtime.date,
        time: showtime.time,
        price: showtime.price.startsWith('$') ? showtime.price : `$${showtime.price}`,
        format: showtime.format,
        distance: '2.5 miles' 
      }));
    } catch (error) {
      console.error(`Error fetching showtimes for movie ${movieId}:`, error);
      return generateFallbackMovieShowtimes(movieId);
    }
  },
  
  //get user location
  getUserLocation: async () => {
    try {
      return await LocationAPI.getCurrentLocation();
    } catch (error) {
      console.error('Error getting user location:', error);
      return null;
    }
  },

  //get cinemas with movies
  getCinemasWithMovies: async (): Promise<CinemaAPI.Cinema[]> => {
    try {
      return await CinemaAPI.getCinemasWithMovies();
    } catch (error) {
      console.error('Error fetching cinemas with movies:', error);
      return [];
    }
  },
  
  //calculate distance beween user and cinema
  calculateDistanceToUser: async (cinema: CinemaAPI.Cinema): Promise<number> => {
    try {
      const userLocation = await LocationAPI.getCurrentLocation() || LocationAPI.DEFAULT_LOCATION;
      
      const distance_km = LocationAPI.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        cinema.location.lat,
        cinema.location.lng
      );
      
      return LocationAPI.kmToMiles(distance_km);
    } catch (error) {
      console.error('Error calculating distance:', error);
      return 0;
    }
  }
}; 