import OpenAI from 'openai';
import { OPENAI_CONFIG } from '../../config/apiKeys';
import { MovieInfo } from './types';

const openai = new OpenAI(OPENAI_CONFIG);

/**
 * Unified approach to extract a movie title from user queries and text
 * @param text The text to extract movie titles from (query or response)
 * @param isUserQuery Whether this is a user query (affects extraction patterns)
 * @returns The movie title if found, or null if not found
 */
export const extractMovieTitle = (text: string, isUserQuery: boolean = true): string | null => {
  if (!text) return null;
  
  const lowercaseText = text.toLowerCase();
  
  // For user queries, use focused patterns
  if (isUserQuery) {
    // Common patterns for showtime queries
    const patterns = [
      /(?:show|get|find|view)\s+(?:me\s+)?(?:the\s+)?showtimes\s+(?:for\s+)?(?:the\s+movie\s+)?["']?([^"']+?)["']?(?:\s+movie)?(?:\s+today|\s+in\s+theaters|\s+near\s+me)?$/i,
      /(?:what\s+are\s+the\s+)?showtimes\s+(?:for\s+)?(?:the\s+movie\s+)?["']?([^"']+?)["']?(?:\s+movie)?(?:\s+today|\s+near\s+me)?/i,
      /when\s+is\s+["']?([^"']+?)["']?\s+(?:movie\s+)?(?:showing|playing)(?:\s+today|\s+near\s+me)?/i,
      /["']?([^"']+?)["']?\s+(?:movie\s+)?showtimes/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        // Clean up the match by removing extra words like "the movie" or trailing punctuation
        const title = match[1].trim()
          .replace(/^the\s+movie\s+/i, '')
          .replace(/[\.,\?!]$/, '');
        
        return title.trim() || null;
      }
    }
    
    return null;
  }
  
  // For response text, look for the [MOVIE] tag format first
  const movieTagRegex = /\[MOVIE\](.*?)\((\d{4})\)\[\/MOVIE\]/;
  const tagMatch = text.match(movieTagRegex);
  
  if (tagMatch && tagMatch[1] && tagMatch[2]) {
    const title = tagMatch[1].trim();
    const year = tagMatch[2];
    return `${title} (${year})`;
  }
  
  // Then try other common patterns for movie titles with years
  const yearPatterns = [
    /([^:()\[\]]+)\s*\((\d{4})\)/,      // Standard: Movie Title (2023)
    /^\d+\.?\s+([^(]+)\s*\((\d{4})\)/,  // Numbered: 1. Movie Title (2023)
    /[•\-\*]\s*([^(]+)\s*\((\d{4})\)/   // Bullet points: • Movie Title (2023)
  ];
  
  for (const pattern of yearPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[2]) {
      const title = match[1].trim()
        .replace(/"/g, '')
        .replace(/\*+/g, '')
        .trim();
      const year = match[2];
      
      // Check for common exclusion phrases
      const exclusionPhraseStarts = [
        'director of', 'directed by', 'directed', 'filmmaker', 
        'creator of', 'producer of', 'writer of', 'starring',
        'here are', 'there are', 'these are', 'those are'
      ];
      
      if (exclusionPhraseStarts.some(phrase => title.toLowerCase().startsWith(phrase))) {
        continue;
      }
      
      return `${title} (${year})`;
    }
  }
  
  return null;
};

/**
 * Extract cinema name from user query
 * @param userQuery The user's query text
 * @returns The cinema name if found, or null if not found
 */
export const extractCinemaName = async (userQuery: string): Promise<string | null> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Extract the cinema/theater name from the user query. Be concise. Return ONLY the cinema name with no other text. If no specific cinema is mentioned, return "NONE".'
        },
        { role: 'user', content: userQuery }
      ],
      temperature: 0.1,
      max_tokens: 50,
    });

    const name = completion.choices[0].message.content.trim();
    return name === 'NONE' ? null : name;
  } catch (error) {
    console.error('Error extracting cinema name:', error);
    return null;
  }
};

/**
 * Extract multiple movie titles from a response text
 * @param responseText Text containing movie information
 * @returns Array of MovieInfo objects with titles and years
 */
export const extractMovieTitlesFromResponse = (responseText: string): MovieInfo[] => {
  if (!responseText) return [];
  
  console.log('Extracting movie titles from response:', responseText.substring(0, 200));
  const movieInfoList: MovieInfo[] = [];
  
  try {
    // First look for the special [MOVIE] tags format
    const movieTagRegex = /\[MOVIE\](.*?)\((\d{4})\)\[\/MOVIE\]/g;
    let match;
    
    while ((match = movieTagRegex.exec(responseText)) !== null) {
      const title = match[1].trim();
      const year = match[2];
      const fullTitle = `${title} (${year})`;
      
      console.log('Found movie with tag format:', fullTitle);
      
      // Check if we already have this exact movie
      const existingIndex = movieInfoList.findIndex(m => 
        m.title.toLowerCase() === title.toLowerCase() && m.year === year
      );
      
      if (existingIndex === -1 && title && title.length > 2) {
        movieInfoList.push({ title, year, fullTitle });
      }
    }
    
    // If we found movies with tags, return them
    if (movieInfoList.length > 0) {
      console.log(`Found ${movieInfoList.length} movies with [MOVIE] tags`);
      return movieInfoList;
    }
    const lines = responseText.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 4) continue;

      const extractedTitle = extractMovieTitle(trimmedLine, false);
      
      if (extractedTitle) {
        const titleYearMatch = extractedTitle.match(/(.+) \((\d{4})\)/);
        
        if (titleYearMatch) {
          const title = titleYearMatch[1];
          const year = titleYearMatch[2];
          
          const existingIndex = movieInfoList.findIndex(m => 
            m.title.toLowerCase() === title.toLowerCase() && m.year === year
          );
          
          if (existingIndex === -1 && title && title.length > 2) {
            movieInfoList.push({ title, year, fullTitle: extractedTitle });
          }
        }
      }
    }
    
    console.log(`Extracted ${movieInfoList.length} movie titles with year info:`, movieInfoList);
    return movieInfoList;
  } catch (error) {
    console.error('Error extracting movie titles:', error);
    return [];
  }
};

/**
 * Extract movie and cinema entities from a response
 * @param response The response text to extract entities from
 * @returns Object containing extracted entities
 */
export const extractEntitiesFromResponse = async (response: string) => {
  try {
    // extract movie titles using the special [MOVIE] tags
    const movieTitles = [];
    const movieTagRegex = /\[MOVIE\](.*?)\((\d{4})\)\[\/MOVIE\]/g;
    let match;
    
    while ((match = movieTagRegex.exec(response)) !== null) {
      const title = match[1].trim();
      const year = match[2];
      movieTitles.push(`${title} (${year})`);
    }
    
    // If we found movies with the tags, use those directly
    if (movieTitles.length > 0) {
      console.log('Found movies with [MOVIE] tags:', movieTitles);
      
      return {
        movieTitles,
        cinemaNames: [], 
        hasMultipleMovies: movieTitles.length > 1,
        hasMultipleCinemas: false,
        primaryMovie: movieTitles.length === 1 ? movieTitles[0] : null,
        primaryCinema: null
      };
    }
    
    // If no [MOVIE] tags were found, fall back to the OpenAI extraction
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Extract movie titles and cinema names from the AI response. Be concise.
          Return a JSON object with the following properties:
          - movieTitles: array of strings for movie titles (IMPORTANT: ALWAYS include the release year in parentheses if available, e.g., "Inception (2010)")
          - cinemaNames: array of strings for cinema names (IMPORTANT: Extract ONLY the official names of cinemas, not descriptions about them)
          - hasMultipleMovies: boolean indicating if multiple movies were mentioned
          - hasMultipleCinemas: boolean indicating if multiple cinemas were mentioned
          - primaryMovie: string with the main movie discussed (or null)
          - primaryCinema: string with the main cinema discussed (or null)   

          For movie names:
          Remember to ALWAYS include the release year in parentheses for any movie titles whenever possible.       
          
          For cinema names:
          1. Extract ONLY the official name of the cinema (e.g., "AMC Empire 25" not "AMC Empire 25 features multiple screens")
          2. Do NOT include descriptive phrases or sentences that follow the cinema name
          3. Do NOT include information about what the cinema offers or features
          4. If a cinema name is followed by words like "features", "offers", "is located", etc., cut off at that point
          5. Make sure each cinema name is unique in the returned list
          6. Be sure to set hasMultipleCinemas correctly if you find multiple unique cinema names

          IMPORTANT: If you extract multiple cinema names, make sure to set hasMultipleCinemas to true.
          If there are 2 or more cinemas, verify that they are actually different cinemas, not different
          ways of referring to the same cinema.
          
          Example JSON response for multiple cinemas:
          {"movieTitles": ["Inception (2010)"], 
           "cinemaNames": ["AMC Empire 25", "Regal Union Square"], 
           "hasMultipleMovies": false, 
           "hasMultipleCinemas": true, 
           "primaryMovie": "Inception (2010)", 
           "primaryCinema": "AMC Empire 25"}`
        },
        { role: 'user', content: response }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 500,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    if (result.cinemaNames && result.cinemaNames.length > 1) {
      result.hasMultipleCinemas = true;
    }
    
    console.log('Extracted entities from response:', {
      movieCount: result.movieTitles?.length || 0,
      cinemaCount: result.cinemaNames?.length || 0,
      hasMultipleMovies: result.hasMultipleMovies,
      hasMultipleCinemas: result.hasMultipleCinemas,
      cinemaNames: result.cinemaNames
    });
    
    return result;
  } catch (error) {
    console.error('Error extracting entities from response:', error);
    return { 
      movieTitles: [], 
      cinemaNames: [], 
      hasMultipleMovies: false, 
      hasMultipleCinemas: false,
      primaryMovie: null,
      primaryCinema: null
    };
  }
};

// Helper function to escape special regex characters in a string
export const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper function to enhance AI response with year information
export const enhanceResponseWithYears = (response: string, movieInfoList: MovieInfo[]): string => {
  let enhancedResponse = response;
  
  movieInfoList.forEach(movieInfo => {
    if (movieInfo.title && movieInfo.year) {
      const escapedTitle = escapeRegExp(movieInfo.title);
      const pattern = new RegExp(`\\b${escapedTitle}\\b(?!\\s*\\(\\d{4}\\))`, 'g');
      enhancedResponse = enhancedResponse.replace(pattern, `${movieInfo.title} (${movieInfo.year})`);
    }
  });
  
  return enhancedResponse;
}; 