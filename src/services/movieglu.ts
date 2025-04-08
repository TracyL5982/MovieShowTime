import axios from 'axios';

// MovieGlu API credentials and constants - Using Sandbox environment
const API_ENDPOINT = 'https://api-gate2.movieglu.com';
const CLIENT = 'COLL_30';
const API_KEY = 'ViSXf5hZOl1S7umjpx6HD88tgshmVxfx6cRQxk1J';
const AUTHORIZATION = 'Basic Q09MTF8zMF9YWDo0REw0MkE2YWZhV1M=';
const TERRITORY = 'XX'; 
const API_VERSION = 'v201';

// Request throttling configuration
const REQUEST_DELAY_MS = 500; 
const MAX_RETRIES = 2; 
let lastRequestTime = 0; 
let requestQueue: (() => Promise<any>)[] = []; 
let isProcessingQueue = false; 

// Movie interface to match our app's structure
export interface Movie {
  id: string;
  title: string;
  poster: string;
  backdrop?: string;
  rating: number;
  description: string;
  cast: string[];
  showtimes: Showtime[];
  releaseDate?: string;
  runtime?: number;
  genres?: string[];
  ageRating?: string;
  directors?: string[];
  distributors?: string;
  trailers?: any[];
}

export interface Showtime {
  time: string;
  date: string;
  theater: string;
  theaterId: string;
  price: number;
}

export interface Cinema {
  id: string;
  name: string;
  distance: number;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  location: {
    lat: number;
    lng: number;
  };
  logo?: string;
}

// Helper function to create the required headers
const createHeaders = () => {
  const now = new Date();
  const deviceDateTime = now.toISOString();
  
  const geolocation = '-22.0;14.0'; 
  
  return {
    'client': CLIENT,
    'x-api-key': API_KEY,
    'authorization': AUTHORIZATION,
    'territory': TERRITORY,
    'api-version': API_VERSION,
    'geolocation': geolocation,
    'device-datetime': deviceDateTime
  };
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const makeThrottledRequest = async <T>(requestFn: () => Promise<T>, fallbackFn?: () => T): Promise<T> => {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        
        if (timeSinceLastRequest < REQUEST_DELAY_MS) {
          await sleep(REQUEST_DELAY_MS - timeSinceLastRequest);
        }
        
        lastRequestTime = Date.now();
        
        let error;
        for (let i = 0; i <= MAX_RETRIES; i++) {
          try {
            const result = await requestFn();
            return resolve(result);
          } catch (err) {
            error = err;
            if (axios.isAxiosError(err) && err.response?.status === 429 && i < MAX_RETRIES) {
              await sleep(REQUEST_DELAY_MS * (i + 1) * 2); // Exponential backoff
              continue;
            }
            break;
          }
        }
        
        if (fallbackFn && error) {
          console.warn('Using fallback data due to API error:', error);
          return resolve(fallbackFn());
        }
        
        reject(error);
      } catch (error) {
        reject(error);
      }
    });
    
    if (!isProcessingQueue) {
      processQueue();
    }
  });
};

const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      try {
        await request();
      } catch (error) {
        console.error('Error processing queued request:', error);
      }
    }
  }
  
  isProcessingQueue = false;
};

export const fetchNowPlayingMovies = async (): Promise<Movie[]> => {
  try {
    const headers = createHeaders();
    
    const response = await makeThrottledRequest(
      () => axios.get(`${API_ENDPOINT}/filmsNowShowing/`, { headers }),
      () => ({ data: null }) 
    );
    
    if (!response.data || !response.data.films || !Array.isArray(response.data.films)) {
      console.error('Invalid API response format');
      return generateFallbackMovies();
    }
    
    console.log(`Received ${response.data.films.length} films from API`);
    
    const movies: Movie[] = [];
    
    for (const film of response.data.films.slice(0, 8)) {
      try {
        console.log(`Processing film: ${film.film_id} - ${film.film_name}`);
        
        const movie: Movie = {
          id: film.film_id.toString(),
          title: film.film_name,
          poster: film.images?.poster?.['1']?.medium?.film_image || 'https://via.placeholder.com/500x750?text=No+Poster',
          backdrop: film.images?.still?.['1']?.medium?.film_image,
          rating: film.rating || 0,
          description: film.synopsis_long || film.synopsis || 'No description available',
          cast: [],
          showtimes: [],
          releaseDate: film.release_date
        };
        
        movies.push(movie);
        
        try {
          const details = await fetchMovieDetails(film.film_id);
          
          if (details) {
            let ageRating = null;
            if (details.age_rating && Array.isArray(details.age_rating) && details.age_rating.length > 0) {
              ageRating = details.age_rating[0].rating;
            } 
            
            const directors = details.directors ? 
              details.directors.map((director: any) => director.director_name) : 
              [];
            
            const distributors = details.distributor ? details.distributor : null;
            
            const trailers = details.trailers || [];
            
            movie.description = details.synopsis_long || details.synopsis || movie.description;
            movie.cast = (details.cast || []).map((actor: any) => actor.cast_name).slice(0, 5);
            movie.runtime = details.duration_mins;
            movie.genres = details.genres?.map((genre: any) => genre.genre_name) || [];
            movie.ageRating = ageRating;
            movie.directors = directors;
            movie.distributors = distributors;
            movie.trailers = trailers;
          }
        } catch (detailsError) {
          console.error(`Error fetching details for film ${film.film_id}:`, detailsError);
        }
        
        fetchShowtimes(film.film_id)
          .then(showtimes => {
            movie.showtimes = showtimes;
          })
          .catch(error => {
            console.error(`Error loading showtimes for ${film.film_id}:`, error);
            movie.showtimes = generateFallbackShowtimes();
          });
        
      } catch (error) {
        console.error(`Error processing movie ${film.film_id}:`, error);
        
      }
    }
    
    console.log(`Processed ${movies.length} movies`);
    return movies.length > 0 ? movies : generateFallbackMovies();
  } catch (error) {
    console.error('Error fetching now playing movies:', error);
    return generateFallbackMovies();
  }
};

// Fetch detailed information about a specific movie
export const fetchMovieDetails = async (filmId: string): Promise<any> => {
  return makeThrottledRequest(
    async () => {
      try {
        const headers = createHeaders();
        
        const response = await axios.get(`${API_ENDPOINT}/filmDetails/`, {
          headers,
          params: {
            film_id: filmId
          }
        });
        
        if (!response.data) {
          console.log(`No film details found for film ${filmId}, using fallback data`);
          return {
            cast: [],
            synopsis: '',
            duration_mins: 0,
            genres: []
          };
        }
        
        return response.data;
      } catch (error) {
        console.error(`Error fetching details for film ${filmId}:`, error);
        return {
          cast: [],
          synopsis: '',
          duration_mins: 0,
          genres: []
        };
      }
    },
    () => ({ 
      cast: [],
      synopsis: '',
      duration_mins: 0,
      genres: []
    })
  );
};

// Fetch showtimes for a specific movie
export const fetchShowtimes = async (filmId: string): Promise<Showtime[]> => {
  return makeThrottledRequest(
    async () => {
      const headers = createHeaders();
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0]; 
      
      try {
        const response = await axios.get(`${API_ENDPOINT}/filmShowTimes/`, {
          headers,
          params: {
            film_id: filmId,
            date: formattedDate,
            n: 5 
          }
        });
        
        if (!response.data || !response.data.cinemas || !Array.isArray(response.data.cinemas)) {
          console.log(`No showtimes data found for film ${filmId}, using fallback data`);
          return generateFallbackShowtimes();
        }
        
        const showtimes: Showtime[] = [];
        
        const dates = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.push(date.toISOString().split('T')[0]);
        }
        
        for (const cinema of response.data.cinemas) {
          if (!cinema.show_dates || !Array.isArray(cinema.show_dates)) {
            continue;
          }
          
          for (const showDate of cinema.show_dates) {
            if (!showDate.times || !Array.isArray(showDate.times)) {
              continue;
            }
            
            for (const time of showDate.times) {
              const prices = [12.99, 14.99, 16.99];
              const price = prices[Math.floor(Math.random() * prices.length)];
              
              showtimes.push({
                time: time.start_time,
                date: showDate.date,
                theater: cinema.cinema_name,
                theaterId: cinema.cinema_id,
                price: price
              });
            }
          }
        }
        
        if (showtimes.length === 0) {
          return generateFallbackShowtimes();
        }
        
        return showtimes;
      } catch (error) {
        console.error(`Error fetching showtimes for film ${filmId}:`, error);
        return generateFallbackShowtimes();
      }
    },
    generateFallbackShowtimes
  );
};

export const fetchNearbyCinemas = async (n: number = 5): Promise<Cinema[]> => {
  return makeThrottledRequest(
    async () => {
      const headers = createHeaders();
      const response = await axios.get(`${API_ENDPOINT}/cinemasNearby/`, {
        headers,
        params: { n }
      });
      
      if (!response.data || !response.data.cinemas || !Array.isArray(response.data.cinemas)) {
        return [];
      }
      
      return response.data.cinemas.map((cinema: any) => ({
        id: cinema.cinema_id,
        name: cinema.cinema_name,
        distance: cinema.distance,
        address: cinema.address,
        city: cinema.city,
        state: cinema.state || 'Namibia', 
        postalCode: cinema.postcode || 'NA', 
        location: {
          lat: cinema.lat,
          lng: cinema.lng
        },
        logo: cinema.logo_url
      }));
    },
    () => [
      {
        id: '8842',
        name: 'Cinema 1 - Big Daddy',
        distance: 2.4,
        address: 'Big Daddy',
        city: 'Sossusvlei',
        state: 'Namibia',
        postalCode: 'NA',
        location: { lat: -24.768314, lng: 15.303885 }
      },
      {
        id: '8845',
        name: 'Cinema 2 - Deadvlei',
        distance: 2.6,
        address: 'Deadvlei',
        city: 'Sossusvlei',
        state: 'Namibia',
        postalCode: 'NA',
        location: { lat: -24.759233, lng: 15.292389 }
      },
      {
        id: '8910',
        name: 'Cinema 3 - Dune 45',
        distance: 3.1,
        address: 'Dune 45',
        city: 'Sossusvlei',
        state: 'Namibia',
        postalCode: 'NA',
        location: { lat: -24.731020, lng: 15.471640 }
      },
      {
        id: '8930',
        name: 'Cinema 4 - Hiddenvlei',
        distance: 3.5,
        address: 'Hiddenvlei',
        city: 'Sossusvlei',
        state: 'Namibia',
        postalCode: 'NA',
        location: { lat: -24.748602, lng: 15.335606 }
      }
    ]
  );
};

export const fetchCinemaDetails = async (cinemaId: string): Promise<Cinema | null> => {
  try {
    const headers = createHeaders();
    
    const response = await axios.get(`${API_ENDPOINT}/cinemaDetails/`, {
      headers,
      params: {
        cinema_id: cinemaId
      }
    });
    
    if (!response.data) {
      return null;
    }
    
    const cinema = response.data;
    return {
      id: cinema.cinema_id,
      name: cinema.cinema_name,
      distance: 0, 
      address: cinema.address,
      city: cinema.city,
      state: cinema.state,
      postalCode: cinema.postcode,
      location: {
        lat: cinema.lat,
        lng: cinema.lng
      },
      logo: cinema.logo_url
    };
  } catch (error) {
    console.error(`Error fetching cinema details for ${cinemaId}:`, error);
    return null;
  }
};

// Fetch showtimes for a specific cinema
export const fetchCinemaShowtimes = async (cinemaId: string, date?: string): Promise<any> => {
  try {
    const headers = createHeaders();
    
    const showDate = date || new Date().toISOString().split('T')[0];
    
    const response = await axios.get(`${API_ENDPOINT}/cinemaShowTimes/`, {
      headers,
      params: {
        cinema_id: cinemaId,
        date: showDate
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching showtimes for cinema ${cinemaId}:`, error);
    return null;
  }
};

const generateFallbackMovies = (): Movie[] => {
  return [
    {
      id: '25',
      title: 'Stargate',
      poster: 'https://via.placeholder.com/500x750?text=Stargate',
      rating: 4.5,
      description: 'An interstellar teleportation device leads to adventure on a distant planet.',
      cast: ['Kurt Russell', 'James Spader', 'Jaye Davidson'],
      releaseDate: '1994-10-28',
      runtime: 121,
      genres: ['Science Fiction', 'Adventure'],
      directors: ['Roland Emmerich'],
      showtimes: generateFallbackShowtimes()
    },
    {
      id: '1685',
      title: 'The Adventures of Priscilla, Queen of the Desert',
      poster: 'https://via.placeholder.com/500x750?text=Priscilla',
      rating: 4.3,
      description: 'Two drag performers and a transgender woman travel across the desert to perform their unique style of cabaret.',
      cast: ['Hugo Weaving', 'Guy Pearce', 'Terence Stamp'],
      releaseDate: '1994-08-10',
      runtime: 104,
      genres: ['Comedy', 'Drama'],
      directors: ['Stephan Elliott'],
      showtimes: generateFallbackShowtimes()
    },
    {
      id: '2756',
      title: 'Mad Max',
      poster: 'https://via.placeholder.com/500x750?text=Mad+Max',
      rating: 4.8,
      description: 'In a post-apocalyptic wasteland, a police officer sets out to avenge the murder of his wife and son.',
      cast: ['Mel Gibson', 'Joanne Samuel', 'Hugh Keays-Byrne'],
      releaseDate: '1979-04-12',
      runtime: 93,
      genres: ['Action', 'Adventure', 'Thriller'],
      directors: ['George Miller'],
      showtimes: generateFallbackShowtimes()
    },
    {
      id: '184126',
      title: 'The Martian',
      poster: 'https://via.placeholder.com/500x750?text=The+Martian',
      rating: 4.6,
      description: 'An astronaut becomes stranded on Mars and must find a way to survive while NASA and a team of scientists work to bring him home.',
      cast: ['Matt Damon', 'Jessica Chastain', 'Kristen Wiig'],
      releaseDate: '2015-10-02',
      runtime: 144,
      genres: ['Science Fiction', 'Drama', 'Adventure'],
      directors: ['Ridley Scott'],
      showtimes: generateFallbackShowtimes()
    },
    {
      id: '3427',
      title: 'From Dusk Till Dawn',
      poster: 'https://via.placeholder.com/500x750?text=From+Dusk+Till+Dawn',
      rating: 4.2,
      description: 'Two criminals and their hostages unknowingly seek refuge in a truck stop populated by vampires.',
      cast: ['George Clooney', 'Quentin Tarantino', 'Harvey Keitel'],
      releaseDate: '1996-01-19',
      runtime: 108,
      genres: ['Horror', 'Action', 'Crime'],
      directors: ['Robert Rodriguez'],
      showtimes: generateFallbackShowtimes()
    }
  ];
};

// Generate fallback showtimes
export const generateFallbackShowtimes = (): Showtime[] => {
  const showtimes: Showtime[] = [];
  const theaters = [
    { name: 'Cinema 1 - Big Daddy', id: '8842' },
    { name: 'Cinema 2 - Deadvlei', id: '8845' },
    { name: 'Cinema 3 - Dune 45', id: '8910' },
    { name: 'Cinema 4 - Hiddenvlei', id: '8930' }
  ];
  
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    
    const times = ['14:30', '17:45', '20:15', '22:30'];
    const prices = [12.99, 14.99, 16.99];
    theaters.forEach(theater => {
      const numShowtimes = Math.floor(Math.random() * 2) + 1;
      for (let j = 0; j < numShowtimes; j++) {
        const timeIndex = Math.floor(Math.random() * times.length);
        const priceIndex = Math.floor(Math.random() * prices.length);
        
        showtimes.push({
          time: times[timeIndex],
          date: dateString,
          theater: theater.name,
          theaterId: theater.id,
          price: prices[priceIndex]
        });
      }
    });
  }
  
  return showtimes;
}; 