import { LocationObject } from 'expo-location';
import { OPENAI_CONFIG } from '../../config/apiKeys';

// Shared interfaces
export interface MovieInfo {
  title: string;
  year?: string;
  fullTitle?: string; 
}

// Constants for screen types
export const SCREEN_TYPES = {
  MOVIE_GALLERY: 'movie_gallery',
  MOVIE_DETAILS: 'movie_details',
  CINEMA_GALLERY: 'cinema_gallery',
  CINEMA_DETAILS: 'cinema_details',
  MOVIE_SHOWTIMES: 'movie_showtimes',
  START_SCREEN: 'start_screen'
};

// Keywords for different query types
export const SHOWTIMES_KEYWORDS = [
  'showtime', 'showtimes', 'showing', 'schedule', 'when is', 'playing time',
  'movie time', 'movie times', 'theater time', 'theatre time', 'cinema time',
  'when can i see', 'when can i watch', 'screening', 'what time'
];

export const SEARCH_QUERY_KEYWORDS = [
  'current', 'currently', 'playing', 'now showing', 'latest', 'new release',
  'opening', 'this week', 'theater', 'cinema', 'showtime', 'schedule',
  'nearby', 'close', 'closest', 'nearest', 'local', 'around me'
];

export const EXPANDED_STATE_KEY = '@movieshowtime:ai_chatbox_expanded';

// Export the OpenAI config so it can be used by other AI Chat components
export { OPENAI_CONFIG }; 