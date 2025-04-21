import { SCREEN_TYPES, SHOWTIMES_KEYWORDS, SEARCH_QUERY_KEYWORDS } from './types';
import { determineScreenType } from './OpenAIService';

/**
 * Check if this is a generic showtime query without specifying a movie
 * @param query The user query to check
 * @returns True if this is a generic query, false if it's a specific movie query
 */
export const isGenericShowtimeQuery = (query: string): boolean => {
  const lowercaseQuery = query.toLowerCase();
  
  // Check for generic showtime queries without a clear movie title
  const genericPatterns = [
    'movie showtimes',
    'movie times',
    'show me showtimes',
    'theater showtimes',
    'cinema showtimes',
    'showtimes near me',
    'movie schedules',
    'what\'s playing',
    'what is playing',
    'screening times',
    'film schedule'
  ];
  
  const hasShowtimeKeywords = SHOWTIMES_KEYWORDS.some(keyword => lowercaseQuery.includes(keyword));
  
  const specificMovieIndicators = [
    ' for ', ' of ', 'part ', 'episode '
  ];
  
  const hasSpecificMovieIndicators = specificMovieIndicators.some(indicator => 
    lowercaseQuery.includes(indicator)
  );
  
  if (hasShowtimeKeywords && 
      (lowercaseQuery.includes('for the') || 
       lowercaseQuery.includes('of the') || 
       lowercaseQuery.match(/for\s+[a-z0-9]/i) || 
       lowercaseQuery.match(/of\s+[a-z0-9]/i))) {
    console.log('Query contains specific movie pattern, NOT treating as generic');
    return false;
  }
  
  const isGenericPattern = genericPatterns.some(pattern => 
    lowercaseQuery.includes(pattern)
  );
  
  return (hasShowtimeKeywords && !hasSpecificMovieIndicators) || isGenericPattern;
};

/**
 * Unified method to determine the user intent and appropriate screen type
 * Combines rule-based detection and LLM-based classification
 * @param userQuery The user's query
 * @returns Object containing screen type and whether web search should be used
 */
export const determineUserIntent = async (userQuery: string): Promise<{screenType: string, useWebSearch: boolean}> => {
  const lowercaseQuery = userQuery.toLowerCase();
  let screenType = '';
  let useWebSearch = false;
  
  // Showtime-related queries
  if (SHOWTIMES_KEYWORDS.some(keyword => lowercaseQuery.includes(keyword))) {
    console.log('Rule-based detection: MOVIE_SHOWTIMES');
    screenType = SCREEN_TYPES.MOVIE_SHOWTIMES;
    useWebSearch = true;
  }
  
  // Movie gallery queries
  else if (lowercaseQuery.includes('movies playing') ||
      lowercaseQuery.includes('current movies') ||
      lowercaseQuery.includes('movies in theaters') ||
      lowercaseQuery.includes('what movies are') ||
      lowercaseQuery.includes('films in theaters') ||
      lowercaseQuery.includes('latest movies')) {
    console.log('Rule-based detection: MOVIE_GALLERY');
    screenType = SCREEN_TYPES.MOVIE_GALLERY;
    useWebSearch = true;
  }
  
  // Cinema gallery queries
  else if (lowercaseQuery.includes('closest cinema') || 
      lowercaseQuery.includes('cinemas near me') || 
      lowercaseQuery.includes('theaters near me') || 
      lowercaseQuery.includes('cinemas around')) {
    console.log('Rule-based detection: CINEMA_GALLERY');
    screenType = SCREEN_TYPES.CINEMA_GALLERY;
    useWebSearch = true;
  }
  
  // Start screen/home screen queries
  else if (lowercaseQuery.includes('go home') ||
      lowercaseQuery.includes('start screen') ||
      lowercaseQuery.includes('main menu') ||
      lowercaseQuery.includes('go back to start')) {
    console.log('Rule-based detection: START_SCREEN');
    screenType = SCREEN_TYPES.START_SCREEN;
    useWebSearch = false;
  }
  
  // If no screen type determined by rules, check for web search keywords
  else if (SEARCH_QUERY_KEYWORDS.some(keyword => lowercaseQuery.includes(keyword))) {
    console.log('General movie/cinema query detected, will use web search');
    useWebSearch = true;
  }
  
  // For more complex queries where rules don't match, use the API
  if (!screenType && lowercaseQuery.length > 5) {
    try {
      const detectedScreenType = await determineScreenType(userQuery, SCREEN_TYPES);
      
      // Validate detected screen type against allowed values
      const validScreenTypes = Object.values(SCREEN_TYPES);
      if (validScreenTypes.includes(detectedScreenType)) {
        screenType = detectedScreenType;
        console.log('API-based detection:', screenType);
        
        // For these screens we'll want to use web search to get data
        if ([SCREEN_TYPES.MOVIE_GALLERY, SCREEN_TYPES.CINEMA_GALLERY, SCREEN_TYPES.MOVIE_SHOWTIMES].includes(detectedScreenType)) {
          useWebSearch = true;
        }
      }
    } catch (error) {
      console.error('Error determining screen type:', error);
    }
  }
  
  return { screenType, useWebSearch };
}; 