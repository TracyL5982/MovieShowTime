import axios from 'axios';
import { getCurrentLocation, calculateDistance, kmToMiles, DEFAULT_LOCATION } from './location';
import { fetchNowPlayingMovies, fetchMovieDetails, Movie } from './tmdb';

export interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  location: {
    lat: number;
    lng: number;
  };
  distance?: number; 
  distance_km?: number; 
  movies?: Movie[];
  logo?: string;
}

const cinemaChainsData: Partial<Cinema>[] = [
  {
    name: 'AMC Theaters',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/AMC_Theatres_logo.svg/220px-AMC_Theatres_logo.svg.png'
  },
  {
    name: 'Regal Cinemas',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Regal_Cinemas_2018.svg/220px-Regal_Cinemas_2018.svg.png'
  },
  {
    name: 'Cinemark Theaters',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6f/Cinemark_logo.svg/220px-Cinemark_logo.svg.png'
  },
  {
    name: 'Alamo Drafthouse',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Alamo_Drafthouse_Cinema_logo.svg/220px-Alamo_Drafthouse_Cinema_logo.svg.png'
  },
  {
    name: 'Marcus Theaters',
    logo: 'https://www.marcustheatres.com/images/Default/mt-logo-yellow-328x86.png'
  },
  {
    name: 'Landmark Theaters',
    logo: 'https://www.landmarktheatres.com/themes/custom/landmark/logo.svg'
  }
];

const cinemaDatabaseRaw: Partial<Cinema>[] = [
  // New York 
  {
    id: 'AMC-Empire25',
    name: 'AMC Empire 25',
    address: '234 W 42nd St',
    city: 'New York',
    state: 'NY',
    postalCode: '10036',
    location: { lat: 40.7566, lng: -73.9885 }
  },
  {
    id: 'Regal-UnionSquare',
    name: 'Regal Union Square',
    address: '850 Broadway',
    city: 'New York',
    state: 'NY',
    postalCode: '10003',
    location: { lat: 40.7347, lng: -73.9915 }
  },
  {
    id: 'AMC-Lincoln',
    name: 'AMC Lincoln Square 13',
    address: '1998 Broadway',
    city: 'New York',
    state: 'NY',
    postalCode: '10023',
    location: { lat: 40.7751, lng: -73.9821 }
  },
  
  // Los Angeles 
  {
    id: 'Chinese-TCL',
    name: 'TCL Chinese Theatre',
    address: '6925 Hollywood Blvd',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90028',
    location: { lat: 34.1022, lng: -118.3415 }
  },
  {
    id: 'Regal-LA-Live',
    name: 'Regal LA Live',
    address: '1000 W Olympic Blvd',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90015',
    location: { lat: 34.0457, lng: -118.2671 }
  },
  {
    id: 'AMC-Century-City',
    name: 'AMC Century City 15',
    address: '10250 Santa Monica Blvd',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90067',
    location: { lat: 34.0564, lng: -118.4195 }
  },
  
  // Chicago 
  {
    id: 'AMC-River-East',
    name: 'AMC River East 21',
    address: '322 E Illinois St',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60611',
    location: { lat: 41.8896, lng: -87.6213 }
  },
  {
    id: 'AMC-NEWCITY',
    name: 'AMC NEWCITY 14',
    address: '1500 N Clybourn Ave',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60610',
    location: { lat: 41.9105, lng: -87.6473 }
  },
  
  // San Francisco 
  {
    id: 'AMC-Metreon',
    name: 'AMC Metreon 16',
    address: '135 4th St',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94103',
    location: { lat: 37.7841, lng: -122.4047 }
  },
  {
    id: 'Alamo-Mission',
    name: 'Alamo Drafthouse New Mission',
    address: '2550 Mission St',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94110',
    location: { lat: 37.7553, lng: -122.4194 }
  }
];

// allocate a logo to each cinema based on its name
const allocateLogos = (cinemas: Partial<Cinema>[]): Cinema[] => {
  return cinemas.map(cinema => {
    const chainMatch = cinemaChainsData.find(chain => 
      cinema.name?.includes(chain.name?.split(' ')[0] || '')
    );
    
    return {
      ...cinema,
      logo: chainMatch?.logo || 'https://via.placeholder.com/150?text=Cinema',
      id: cinema.id || `cinema-${Math.random().toString(36).substring(2, 9)}`,
      distance: 0,
      movies: []
    } as Cinema;
  });
};

const cinemaDatabase: Cinema[] = allocateLogos(cinemaDatabaseRaw);

export const getNearbyCinemas = async (limit: number = 5): Promise<Cinema[]> => {
  try {
    const userLocation = await getCurrentLocation() || DEFAULT_LOCATION;
    
    const cinemasWithDistance = cinemaDatabase.map(cinema => {
      const distance_km = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        cinema.location.lat,
        cinema.location.lng
      );
      
      return {
        ...cinema,
        distance_km,
        distance: parseFloat(kmToMiles(distance_km).toFixed(1))
      };
    });
    
    return cinemasWithDistance
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting nearby cinemas:', error);
    return cinemaDatabase.slice(0, limit); 
  }
};

// get a specific cinema by ID
export const getCinemaById = async (cinemaId: string): Promise<Cinema | null> => {
  try {
    const userLocation = await getCurrentLocation() || DEFAULT_LOCATION;
    
    const cinema = cinemaDatabase.find(c => c.id === cinemaId);
    
    if (!cinema) {
      return null;
    }
    
    const distance_km = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      cinema.location.lat,
      cinema.location.lng
    );
    
    return {
      ...cinema,
      distance_km,
      distance: parseFloat(kmToMiles(distance_km).toFixed(1))
    };
  } catch (error) {
    console.error(`Error getting cinema with ID ${cinemaId}:`, error);
    return cinemaDatabase.find(c => c.id === cinemaId) || null;
  }
};

export interface Showtime {
  id: string;
  movieId: string;
  cinemaId: string;
  time: string;
  date: string;
  price: string;
  format?: string;
  theater: string; 
}

export const generateShowtimesForCinema = (cinemaId: string, movieId: string, cinemaName: string): Showtime[] => {
  const showtimes: Showtime[] = [];
  const today = new Date();
  

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    
    const numShowtimes = 2 + Math.floor(Math.random() * 3);
    
    const timeSlots = ['10:30', '12:15', '14:00', '15:45', '17:30', '19:15', '21:00', '22:45'];
    
    const startIndex = Math.floor(Math.random() * (timeSlots.length - numShowtimes));
    const selectedTimes = timeSlots.slice(startIndex, startIndex + numShowtimes);
    
    selectedTimes.forEach(time => {
      const hour = parseInt(time.split(':')[0]);
      let price = 12.99; 
      
      if (hour < 16) {
        price = 10.99;
      }
      
      if (hour >= 19) {
        price = 15.99;
      }
      
      const dayOfWeek = (date.getDay() + i) % 7;
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        price += 2;
      }
      
      const formats = ['Standard', 'IMAX', '3D', 'Dolby'];
      const formatIndex = Math.floor(Math.random() * 10); 
      let format = 'Standard';
      
      if (formatIndex < formats.length) {
        format = formats[formatIndex];

        if (format !== 'Standard') {
          price += 5;
        }
      }
      
      showtimes.push({
        id: `${cinemaId}-${movieId}-${dateString}-${time}`,
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
  
  return showtimes.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.time.localeCompare(b.time);
  });
};

export const getShowtimesForMovie = async (movieId: string): Promise<Showtime[]> => {
  try {
    const cinemas = await getNearbyCinemas(5);
    
    let allShowtimes: Showtime[] = [];
    
    cinemas.forEach(cinema => {
      const showtimes = generateShowtimesForCinema(cinema.id, movieId, cinema.name);
      allShowtimes = [...allShowtimes, ...showtimes];
    });
    
    return allShowtimes;
  } catch (error) {
    console.error(`Error getting showtimes for movie ${movieId}:`, error);
    return [];
  }
};


export const getShowtimesForCinema = async (cinemaId: string): Promise<{[key: string]: Showtime[]}> => {
  try {
    const movies = await fetchNowPlayingMovies();
    
    const cinema = await getCinemaById(cinemaId);
    
    if (!cinema) {
      console.log(`Cinema with ID ${cinemaId} not found, using fallback data`);
      return generateFallbackCinemaShowtimes(cinemaId, movies);
    }
    
    const showtimesByMovie: {[key: string]: Showtime[]} = {};
    
    movies.forEach(movie => {
      try {
        const showtimes = generateShowtimesForCinema(cinemaId, movie.id, cinema.name);
        showtimesByMovie[movie.id] = showtimes;
      } catch (movieError) {
        console.warn(`Error generating showtimes for movie ${movie.id} at cinema ${cinemaId}:`, movieError);
        showtimesByMovie[movie.id] = generateShowtimesForCinema(cinemaId, movie.id, getCinemaNameFromId(cinemaId));
      }
    });
    
    return showtimesByMovie;
  } catch (error) {
    console.error(`Error getting showtimes for cinema ${cinemaId}:`, error);
    const movies = await fetchNowPlayingMovies().catch(() => []);
    return generateFallbackCinemaShowtimes(cinemaId, movies);
  }
};

const generateFallbackCinemaShowtimes = (cinemaId: string, movies: Movie[]): {[key: string]: Showtime[]} => {
  const showtimesByMovie: {[key: string]: Showtime[]} = {};
  const cinemaName = getCinemaNameFromId(cinemaId);
  
  movies.forEach(movie => {
    showtimesByMovie[movie.id] = generateShowtimesForCinema(cinemaId, movie.id, cinemaName);
  });
  
  return showtimesByMovie;
};

const getCinemaNameFromId = (cinemaId: string): string => {
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

export const convertToTMDbShowtime = (showtime: Showtime): import('./tmdb').Showtime => {
  return {
    time: showtime.time,
    date: showtime.date,
    theater: showtime.theater,
    price: parseFloat(showtime.price)
  };
};

export const getCinemasWithMovies = async (): Promise<Cinema[]> => {
  try {
    const cinemas = await getNearbyCinemas();
    
    const movies = await fetchNowPlayingMovies();
    
    return Promise.all(cinemas.map(async (cinema) => {
      return {
        ...cinema,
        movies: movies.map(movie => ({
          ...movie,
          showtimes: generateShowtimesForCinema(cinema.id, movie.id, cinema.name)
            .map(convertToTMDbShowtime) 
        }))
      };
    }));
  } catch (error) {
    console.error('Error getting cinemas with movies:', error);
    return [];
  }
}; 