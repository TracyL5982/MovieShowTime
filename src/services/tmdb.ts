import axios from 'axios';

const API_KEY = '8345bfc1cf757b91cc4192f03ed31334'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';


//Refehttps://developer.themoviedb.org/docs/search-and-query-for-details
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
  distributors?: string[];
  trailers?: any[];
}

export interface Showtime {
  time: string;
  date: string;
  theater: string;
  price: number;
}

export const fetchNowPlayingMovies = async (): Promise<Movie[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/movie/now_playing`, {
      params: {
        api_key: API_KEY,
        language: 'en-US',
        page: 1,
        region: 'US'
      }
    });
    
    if (!response.data || !response.data.results || !Array.isArray(response.data.results)) {
      console.error('Invalid API response format');
      return generateMockMovies(); 
    }
    
    const movies = await Promise.all(
      response.data.results.slice(0, 10).map(async (movie: any) => {
        try {
          const details = await fetchMovieDetails(movie.id);
          
          return {
            id: movie.id.toString(),
            title: movie.title,
            poster: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
            backdrop: movie.backdrop_path ? `${IMAGE_BASE_URL}${movie.backdrop_path}` : undefined,
            rating: movie.vote_average,
            description: movie.overview || 'No description available',
            cast: details.cast ? details.cast.slice(0, 5).map((actor: any) => actor.name) : [],
            releaseDate: movie.release_date,
            runtime: details.runtime,
            genres: details.genres ? details.genres.map((genre: any) => genre.name) : [],
            showtimes: generateMockShowtimes(), 
          };
        } catch (error) {
          console.error(`Error processing movie ${movie.id}:`, error);
          return {
            id: movie.id.toString(),
            title: movie.title,
            poster: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
            rating: movie.vote_average,
            description: movie.overview || 'No description available',
            cast: [],
            showtimes: generateMockShowtimes(),
          };
        }
      })
    );
    
    return movies;
  } catch (error) {
    console.error('Error fetching now playing movies:', error);
    return generateMockMovies();
  }
};

export const fetchMovieDetails = async (movieId: number): Promise<any> => {
  try {
    const detailsResponse = await axios.get(`${BASE_URL}/movie/${movieId}`, {
      params: {
        api_key: API_KEY,
        language: 'en-US',
        append_to_response: 'credits'
      }
    });
    
    return {
      ...detailsResponse.data,
      cast: detailsResponse.data.credits?.cast || []
    };
  } catch (error) {
    console.error(`Error fetching details for movie ${movieId}:`, error);
    return { cast: [] }; 
  }
};

// Generate mock movies for fallback
const generateMockMovies = (): Movie[] => {
  return [
    {
      id: '1',
      title: 'Dune: Part Two',
      poster: 'https://m.media-amazon.com/images/M/MV5BN2QyZGU4ZDctOWMzMy00NTc5LThlOTQtOGMyNmVlNzlhYjg5XkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_.jpg',
      rating: 8.8,
      description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'],
      releaseDate: '2024-03-01',
      runtime: 166,
      genres: ['Sci-Fi', 'Adventure', 'Drama'],
      showtimes: generateMockShowtimes(),
    },
    {
      id: '2',
      title: 'Godzilla x Kong',
      poster: 'https://m.media-amazon.com/images/M/MV5BNzJlM2NmZTItOGQyYS00MmE2LTkwZGUtNDFkNmJmZjRjZjcxXkEyXkFqcGdeQXVyMTA3MDk2NDg2._V1_FMjpg_UX1000_.jpg',
      rating: 7.5,
      description: 'Godzilla and Kong team up to face a colossal threat hidden deep within the planet.',
      cast: ['Rebecca Hall', 'Brian Tyree Henry', 'Dan Stevens'],
      releaseDate: '2024-04-10',
      runtime: 115,
      genres: ['Action', 'Sci-Fi', 'Adventure'],
      showtimes: generateMockShowtimes(),
    },
    {
      id: '3',
      title: 'Ghostbusters: Frozen Empire',
      poster: 'https://m.media-amazon.com/images/M/MV5BNGE5YWM4NTQtNjQ0OS00YzM0LTgyM2MtYTRiOTY3NGQxZDNjXkEyXkFqcGdeQXVyMTAxNzQ1NzI@._V1_.jpg',
      rating: 6.9,
      description: 'The Spengler family returns to where it all started – the iconic New York City firehouse – and teams up with the original Ghostbusters.',
      cast: ['Paul Rudd', 'Carrie Coon', 'Bill Murray'],
      releaseDate: '2024-03-22',
      runtime: 115,
      genres: ['Comedy', 'Fantasy', 'Adventure'],
      showtimes: generateMockShowtimes(),
    },
  ];
};

// Helper function to generate mock showtimes
const generateMockShowtimes = (): Showtime[] => {
  const showtimes: Showtime[] = [];
  const theaters = ['AMC Empire 25', 'Regal Cinemas', 'Cinemark', 'Alamo Drafthouse'];
  const today = new Date();
  
  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    
    const numShowtimes = 3 + Math.floor(Math.random() * 2);
    
    for (let j = 0; j < numShowtimes; j++) {
      const hour = 12 + Math.floor(Math.random() * 10);
      const minute = Math.random() < 0.5 ? '00' : '30';
      const time = `${hour}:${minute}`;
      
      const theater = theaters[Math.floor(Math.random() * theaters.length)];
      
      const price = 12.5 + Math.floor(Math.random() * 6) + (Math.random() < 0.5 ? 0 : 0.5);
      
      showtimes.push({
        time,
        date: dateString,
        theater,
        price
      });
    }
  }
  
  return showtimes.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.time.localeCompare(b.time);
  });
}; 