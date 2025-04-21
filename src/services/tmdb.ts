import axios from 'axios';
import { TMDB_API_KEY } from '../config/apiKeys';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export interface FilmPerson {
  name: string;
  profile_path: string;
  job?: string;
}

//Refehttps://developer.themoviedb.org/docs/search-and-query-for-details
export interface Movie {
  id: string;
  title: string;
  poster: string;
  backdrop?: string;
  rating: number;
  description: string;
  cast: FilmPerson[];
  showtimes: Showtime[];
  releaseDate?: string;
  runtime?: number;
  genres?: string[];
  ageRating?: string;
  directors?: FilmPerson[];
  writers?: FilmPerson[];
  distributors?: string[];
  trailers?: any[];
}

export interface Showtime {
  time: string;
  date: string;
  theater: string;
  price: number;
}

export const searchMovies = async (query: string): Promise<Movie[]> => {
  try {
    console.log(`Searching for movies with query: ${query}`);
    
    const yearMatch = query.match(/\s+(\d{4})$/);
    let searchQuery = query;
    let searchYear = null;
    
    if (yearMatch) {
      searchYear = yearMatch[1];
      searchQuery = query.replace(/\s+\d{4}$/, '').trim();
      console.log(`Extracted year ${searchYear} from query, searching for: "${searchQuery}" with year ${searchYear}`);
    }
    
    const response = await axios.get(`${BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        query: searchQuery,
        primary_release_year: searchYear, 
        include_adult: false,
        page: 1
      }
    });
    
    if (!response.data || !response.data.results || !Array.isArray(response.data.results)) {
      console.error('Invalid search API response format');
      return []; 
    }
    
    console.log(`TMDB returned ${response.data.results.length} results for query "${searchQuery}" ${searchYear ? `(year: ${searchYear})` : ''}`);

    let allResults = response.data.results;
    
    if (searchYear && allResults.length === 0) {
      console.log(`No results with primary_release_year=${searchYear}, trying broader search`);
      
      const broadResponse = await axios.get(`${BASE_URL}/search/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          query: searchQuery,
          include_adult: false,
          page: 1
        }
      });
      
      if (broadResponse.data && broadResponse.data.results) {
        allResults = broadResponse.data.results;
        console.log(`Broader search returned ${allResults.length} results`);
      }
    }
    
    let prioritizedResults = [];
    
    // First priority: Exact title AND exact year match
    const exactTitleAndYearMatches = allResults.filter((movie: any) => {
      const movieTitle = movie.title.toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : null;
      
      const exactTitleMatch = movieTitle === searchLower;
      const exactYearMatch = searchYear && releaseYear === searchYear;
      
      if (exactTitleMatch && exactYearMatch) {
        console.log(`PRIORITY 1: Exact title AND year match: "${movie.title}" (${releaseYear})`);
        return true;
      }
      return false;
    });
    
    // Second priority: Exact title match, any year
    const exactTitleMatches = allResults.filter((movie: any) => {
      const movieTitle = movie.title.toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : null;
  
      if (exactTitleAndYearMatches.some(m => m.id === movie.id)) {
        return false;
      }
      
      const exactTitleMatch = movieTitle === searchLower;
      
      if (exactTitleMatch) {
        console.log(`PRIORITY 2: Exact title match with different year: "${movie.title}" (${releaseYear})`);
        return true;
      }
      return false;
    });
    
    // Third priority: Contains title and exact year
    const titleContainsAndYearMatches = allResults.filter((movie: any) => {
      const movieTitle = movie.title.toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : null;

      if (exactTitleAndYearMatches.some(m => m.id === movie.id) || 
          exactTitleMatches.some(m => m.id === movie.id)) {
        return false;
      }
      
      const titleContains = searchLower.length >= 4 && 
                            (movieTitle.includes(searchLower) || searchLower.includes(movieTitle));
      const exactYearMatch = searchYear && releaseYear === searchYear;
      
      if (titleContains && exactYearMatch) {
        console.log(`PRIORITY 3: Title contains and exact year: "${movie.title}" (${releaseYear})`);
        return true;
      }
      return false;
    });
    
    // Fourth priority: Contains title, any year
    const titleContainsMatches = allResults.filter((movie: any) => {
      const movieTitle = movie.title.toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : null;

      if (exactTitleAndYearMatches.some(m => m.id === movie.id) || 
          exactTitleMatches.some(m => m.id === movie.id) ||
          titleContainsAndYearMatches.some(m => m.id === movie.id)) {
        return false;
      }
      
      const titleContains = searchLower.length >= 4 && 
                            (movieTitle.includes(searchLower) || searchLower.includes(movieTitle));
      
      if (titleContains) {
        console.log(`PRIORITY 4: Title contains match: "${movie.title}" (${releaseYear})`);
        return true;
      }
      return false;
    });
    
    prioritizedResults = [
      ...exactTitleAndYearMatches,
      ...exactTitleMatches,
      ...titleContainsAndYearMatches,
      ...titleContainsMatches
    ];
    
    const resultsToProcess = prioritizedResults.length > 0 
      ? prioritizedResults 
      : allResults.slice(0, 5); 
    
    console.log(`Processing ${resultsToProcess.length} prioritized results for detailed fetching`);
    

    const movies = await Promise.all(
      resultsToProcess.map(async (movie: any) => {
        try {
          const details = await fetchMovieDetails(movie.id);
          
          return {
            id: movie.id.toString(),
            title: movie.title,
            poster: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
            backdrop: movie.backdrop_path ? `${IMAGE_BASE_URL}${movie.backdrop_path}` : undefined,
            rating: movie.vote_average,
            description: movie.overview || 'No description available',
            cast: details.cast ? details.cast.slice(0, 5).map((actor: any) => ({
              name: actor.name,
              profile_path: actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : 'https://via.placeholder.com/70x70?text=No+Image'
            })) : [],
            releaseDate: movie.release_date,
            runtime: details.runtime,
            genres: details.genres ? details.genres.map((genre: any) => genre.name) : [],
            showtimes: [],
            directors: details.credits?.crew?.filter((crew: any) => crew.job === 'Director')
              .map((director: any) => ({
                name: director.name,
                profile_path: director.profile_path ? `${IMAGE_BASE_URL}${director.profile_path}` : 'https://via.placeholder.com/70x70?text=No+Image'
              })) || []
          };
        } catch (error) {
          console.error(`Error processing search result ${movie.id}:`, error);
          return {
            id: movie.id.toString(),
            title: movie.title,
            poster: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
            rating: movie.vote_average,
            description: movie.overview || 'No description available',
            cast: [],
            genres: [],
            showtimes: [],
            releaseDate: movie.release_date
          };
        }
      })
    );
    
    return movies;
  } catch (error) {
    console.error('Error searching for movies:', error);
    return [];
  }
};

export const fetchNowPlayingMovies = async (): Promise<Movie[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/movie/now_playing`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1,
        region: 'US'
      }
    });
    
    if (!response.data || !response.data.results || !Array.isArray(response.data.results)) {
      console.error('Invalid API response format');
      return [];
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
            cast: details.cast ? details.cast.slice(0, 5).map((actor: any) => ({
              name: actor.name,
              profile_path: actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : 'https://via.placeholder.com/70x70?text=No+Image'
            })) : [],
            releaseDate: movie.release_date,
            runtime: details.runtime,
            genres: details.genres ? details.genres.map((genre: any) => genre.name) : [],
            showtimes: [],
            directors: details.credits?.crew?.filter((crew: any) => crew.job === 'Director')
              .map((director: any) => ({
                name: director.name,
                profile_path: director.profile_path ? `${IMAGE_BASE_URL}${director.profile_path}` : 'https://via.placeholder.com/70x70?text=No+Image'
              })) || []
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
            genres: [],
            showtimes: [],
          };
        }
      })
    );
    
    return movies;
  } catch (error) {
    console.error('Error fetching now playing movies:', error);
    return [];
  }
};

export const fetchMovieDetails = async (movieId: number): Promise<any> => {
  try {
    const detailsResponse = await axios.get(`${BASE_URL}/movie/${movieId}`, {
      params: {
        api_key: TMDB_API_KEY,
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