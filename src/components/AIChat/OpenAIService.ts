import OpenAI from 'openai';
import { OPENAI_CONFIG } from '../../config/apiKeys';
import * as Location from 'expo-location';

const openai = new OpenAI(OPENAI_CONFIG);

/**
 * Formats structured cinema data for display to the user
 */
export const formatStructuredCinemaResponse = (structuredData: any): string => {
  let formattedText = 'Here are some cinemas that might interest you:\n\n';
  
  structuredData.cinemas.forEach((cinema, index) => {
    formattedText += `**[${cinema.name}]**\n`;
    formattedText += `_${cinema.address || 'Address information not available'}_\n`;
    formattedText += `${cinema.description}\n`;
    
    if (cinema.distance) {
      formattedText += `📍 ${cinema.distance}\n`;
    }
    
    if (cinema.url) {
      formattedText += `🔗 [Website](${cinema.url})\n`;
    }
    
    if (index < structuredData.cinemas.length - 1) {
      formattedText += '\n';
    }
  });
  
  return formattedText;
};

/**
 * Formats movie-only responses to remove cinema details
 */


export const formatMovieOnlyResponse = async (responseText: string, movieInfoList: any[]): Promise<string> => {
  try {
    console.log('Processing movie-only response to remove cinema details');
    
    if (movieInfoList.length === 0) {
      console.log('No movie information found in the response, returning original');
      return responseText;
    }
    
    let formattedResponse = "Currently Playing Movies:\n\n";
    
    movieInfoList.forEach(movie => {
      let description = "";
      const escapedTitle = movie.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const moviePattern = new RegExp(`${escapedTitle}.*?\\(${movie.year || '\\d{4}'}\\).*?([^•\\n]+)`, 'i');
      const descMatch = responseText.match(moviePattern);
      
      if (descMatch && descMatch[1]) {
        description = descMatch[1].replace(/^[-:\s]+/, '').trim();
        
        if (description.length > 120) {
          description = description.substring(0, 117) + '...';
        }
        if (!description.startsWith('-')) {
          description = `- ${description}`;
        }
      }
      
      // Ensure we have valid year information
      const yearDisplay = movie.year ? ` (${movie.year})` : '';
      
      // Add the formatted movie entry
      formattedResponse += `• ${movie.title}${yearDisplay}${description ? ' ' + description : ''}\n`;
    });
    
    // Add a note about checking local listings
    formattedResponse += "\nPlease check your local theater listings for showtimes and availability.";
    
    console.log('Formatted movie-only response:', formattedResponse);
    return formattedResponse;
  } catch (error) {
    console.error('Error formatting movie-only response:', error);
    return responseText; // Return original text if formatting fails
  }
};

/**
 * Extracts text from web search response
 */
export const extractTextFromResponse = (response: any): string => {
  if (response && response.output_text) {
    console.log('Found output_text in response');
    return response.output_text;
  }
  
  if (response && response.items && Array.isArray(response.items)) {
    console.log('Found items array in response');
    for (const item of response.items) {
      if (item.type === 'message' && item.content && Array.isArray(item.content) && item.content.length > 0) {
        console.log('Found message content in items');
        const text = item.content[0].text || '';
        console.log('RAW EXTRACTED RESPONSE TEXT:', text);
        return text;
      }
    }
  }
  
  if (response && response.content && Array.isArray(response.content)) {
    console.log('Found content array in response');
    for (const content of response.content) {
      if (content.type === 'text' && content.text) {
        console.log('Found text in content');
        console.log('RAW EXTRACTED RESPONSE TEXT:', content.text);
        return content.text;
      }
    }
  }
  
  if (response && response.choices && Array.isArray(response.choices) && response.choices.length > 0) {
    console.log('Found choices in response');
    const choice = response.choices[0];
    
    if (choice.message && typeof choice.message.content === 'string') {
      console.log('Found message.content in choices');
      console.log('RAW EXTRACTED RESPONSE TEXT:', choice.message.content);
      return choice.message.content;
    }
    
    if (choice.text && typeof choice.text === 'string') {
      console.log('Found text in choices');
      console.log('RAW EXTRACTED RESPONSE TEXT:', choice.text);
      return choice.text;
    }
  }
  
  console.log('Trying fallback text extraction');
  for (const key in response) {
    if (typeof response[key] === 'string' && response[key].length > 100) {
      return response[key];
    }
  }
  
  console.log('Could not extract text from response:', 
    JSON.stringify(response).substring(0, 500) + '...');
  
  return null;
};

/**
 * Gets structured cinema data from location information
 */
export const requestStructuredCinemaData = async (query: string, userLocation: Location.LocationObject | null): Promise<string> => {
  try {
    console.log('Requesting structured cinema data for query:', query);
    
    // Initialize location information for the prompt
    let locationContext = "New York, NY";
    
    // Use actual user location if available
    if (userLocation && userLocation.coords) {
      try {
        const { latitude, longitude } = userLocation.coords;
        console.log('User coordinates:', latitude, longitude);
        
        // Try to get the city and region from coordinates
        const geocodingResponse = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });
        
        console.log('Geocoding response:', JSON.stringify(geocodingResponse, null, 2));
        
        if (geocodingResponse && geocodingResponse.length > 0) {
          const locationData = geocodingResponse[0];
          console.log('User location data:', JSON.stringify(locationData, null, 2));
          
          // Get location components
          const city = locationData.city || locationData.subregion || "New York";
          const region = locationData.region || "NY";
          const country = locationData.country || "US";
          
          locationContext = `${city}, ${region}${country === "US" ? "" : ", " + country}`;
          console.log('Using actual user location for cinema search:', locationContext);
        } else {
          console.log('No geocoding results returned, using default location');
        }
      } catch (error) {
        console.error('Error getting location context from coordinates:', error);
        console.log('Falling back to default New York location');
      }
    } else {
      console.log('No user location available, using default location context:', locationContext);
    }

    const systemPrompt = `You are a helpful assistant that provides information about movie theaters and cinemas. Be concise and direct with your answers.
When the user asks about cinemas or theaters, provide a structured response about relevant cinemas in ${locationContext} or the area they specifically request.

For each cinema, provide:
1. name: Full official name of the cinema
2. address: IMPORTANT - Provide the most complete and accurate address possible, including street number, street name, city, state and zip. This is a priority field.
3. description: A brief description of what makes this cinema special, its amenities, or notable features (1-2 sentences max)
4. url: Website URL of the cinema or Google Maps URL if the website is unknown
5. distance: Approximate distance from the user's location (use "2.5 miles away" format if unknown)

JSON Format Schema:
{
  "cinemas": [
    {
      "name": "Cinema Name",
      "address": "123 Example St, New York, NY 10001",
      "description": "Brief description of the cinema. Keep this to 1-2 sentences.",
      "url": "https://example.com",
      "distance": "2.5 miles away"
    }
  ]
}

Provide information for 3-5 popular or highly-rated cinemas that match the query.
DO NOT make up facts - if you're unsure about details, provide what you know and indicate what's uncertain.
For the address field, always provide the most specific and accurate address information available.`;

    // Make the API call for structured output
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    // Extract and log the structured response
    const structuredResponse = completion.choices[0].message.content;
    console.log('Received structured cinema data');
    
    // Parse the structured response to validate it's proper JSON
    const parsedResponse = JSON.parse(structuredResponse);
    
    // Validate that the response follows our expected schema
    if (parsedResponse && parsedResponse.cinemas && Array.isArray(parsedResponse.cinemas)) {
      console.log(`Extracted ${parsedResponse.cinemas.length} cinemas in structured format`);
      
      // Format the response for display to the user
      const formattedResponse = formatStructuredCinemaResponse(parsedResponse);
      return formattedResponse;
    } else {
      console.error('Response did not match expected schema');
      return '';
    }
  } catch (error) {
    console.error('Error getting structured cinema data:', error);
    return '';
  }
};

/**
 * Determines the appropriate screen type for a query
 */
export const determineScreenType = async (userQuery: string, screenTypes: any) => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a movie showtime app. Be concise. Based on the user's query, determine which screen should be shown.
          Return ONLY one of the following screen types with NO additional text. Find data corresponding to the user's query:
          - ${screenTypes.MOVIE_GALLERY} - if the user wants to see a list of movies (e.g., "what movies are playing", "show me movies in theaters")
          - ${screenTypes.MOVIE_DETAILS} - if the user wants details about a specific movie (e.g., "tell me about Dune", "show information for Godzilla x Kong")
          - ${screenTypes.CINEMA_GALLERY} - if the user wants to see cinemas/theaters (e.g., "show me nearby theaters", "what cinemas are close to me")
          - ${screenTypes.CINEMA_DETAILS} - if the user wants to see details about a specific cinema (e.g., "tell me about AMC Empire 25", "show information for Regal Cinemas")
          - ${screenTypes.MOVIE_SHOWTIMES} - if the user wants showtimes for a movie (e.g., "when is Dune playing", "showtimes for Godzilla")
          - ${screenTypes.START_SCREEN} - if the user wants to go to the home screen or start over (e.g., "go home", "start screen", "main menu")
          
          If the query doesn't clearly match any of the screens, don't return any screen type. In these cases, just respond conversationally to the user without changing screens.
          `
        },
        { role: 'user', content: userQuery }
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error determining screen type:', error);
    return '';
  }
};

/**
 * Gets a conversational response from OpenAI
 */
export const getOpenAIResponse = async (query: string, conversationHistory: any[] = []): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant for a movie showtime app. Answer questions about movies, actors, directors, genres, cinema information, and provide recommendations.
          Be conversational, informative, and engaging. When asked for movie recommendations, suggest actual movies that exist, especially recent or popular ones.
          
          CRITICAL FORMATTING RULES FOR MOVIE TITLES:
          1. ALWAYS format movie titles using the exact pattern: [MOVIE]Title (YYYY)[/MOVIE]
             For example: [MOVIE]Inception (2010)[/MOVIE] or [MOVIE]The Godfather (1972)[/MOVIE]
          2. Include the year in parentheses INSIDE the [MOVIE] tags
          3. NEVER omit the year for any movie title
          4. When mentioning actors, directors, or characters, do NOT use the [MOVIE] tags
          5. If you don't know the exact year, use your best estimate but ALWAYS include a year
          
          For movie information, include:
          - Release year (ALWAYS in parentheses within the [MOVIE] tags)
          - Director (if appropriate to the query)
          - Brief description or genre
          
          For recommendations, provide:
          - 3-5 relevant movie suggestions, EACH formatted with [MOVIE] tags
          - Format each suggestion as a bullet point: • [MOVIE]Title (YYYY)[/MOVIE]
          - Brief reason why each is recommended
          
          Keep responses concise but informative. Don't apologize for being an AI or mention limitations.
          
          Examples of correct formatting:
          - "The director of [MOVIE]Dune (2021)[/MOVIE] is Denis Villeneuve."
          - "Here are some comedy recommendations:
            • [MOVIE]Superbad (2007)[/MOVIE] - Hilarious coming-of-age comedy
            • [MOVIE]The Grand Budapest Hotel (2014)[/MOVIE] - Quirky Wes Anderson masterpiece"
          `
        },
        ...conversationHistory.slice(-6), // Include recent conversation for context
        { role: 'user', content: query }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    // Get the response and post-process it if needed
    let response = completion.choices[0].message.content;
    console.log('Got OpenAI response for conversational query');
    
    return response;
  } catch (error) {
    console.error('Error getting OpenAI response:', error);
    return null;
  }
};

/**
 * Performs a web search using OpenAI's tools
 */
export const performWebSearch = async (userQuery: string, userLocation: Location.LocationObject | null): Promise<string> => {
  try {
    console.log('Performing web search for query:', userQuery);
    
    // Check if the query is cinema-related
    const isCinemaQuery = userQuery.toLowerCase().includes('cinema') || 
                          userQuery.toLowerCase().includes('theater') || 
                          userQuery.toLowerCase().includes('theatre') ||
                          userQuery.toLowerCase().includes('nearby movie') ||
                          userQuery.toLowerCase().includes('local cinema');
    
    // Check if the query is movie-only related
    const isMovieOnlyQuery = 
      (userQuery.toLowerCase().includes('movie') || 
        userQuery.toLowerCase().includes('film') ||
        userQuery.toLowerCase().includes('playing') || 
        userQuery.toLowerCase().includes('showing') ||
        userQuery.toLowerCase().includes('watch')) &&
      !isCinemaQuery;
    
    // Use structured output for cinema queries
    if (isCinemaQuery) {
      console.log('Using structured output for cinema query');
      return await requestStructuredCinemaData(userQuery, userLocation);
    }
    
    // Use regular web search for non-cinema queries
    let enhancedQuery = userQuery;
    
    if (isMovieOnlyQuery) {
      // For movie-only queries, request accurate, factual information about current movies
      enhancedQuery = `${userQuery} (include accurate movie release years in parentheses, focus ONLY on current movies, provide factual information about real movies, no specific cinema information, be concise and direct)`;
      console.log('Enhanced movie-only query:', enhancedQuery);
    } else if (userQuery.toLowerCase().includes('movie') || 
        userQuery.toLowerCase().includes('film') ||
        userQuery.toLowerCase().includes('playing') ||
        userQuery.toLowerCase().includes('watch')) {
      enhancedQuery = `${userQuery} (include accurate movie release years in parentheses, be concise and direct)`;
    }
    
    console.log('Performing web search for query:', enhancedQuery);
    
    // Configure user location for the web search
    let userLocationConfig = {
      type: "approximate" as const,
      country: "US",
      city: "United States", 
      region: "United States" 
    };
    
    // Don't include specific location for movie-only queries
    if (!isMovieOnlyQuery) {
      // Use actual user location if available
      if (userLocation && userLocation.coords) {
        try {
          const { latitude, longitude } = userLocation.coords;
          console.log('User coordinates:', latitude, longitude);
          
          // Try to get the city and region from coordinates
          const geocodingResponse = await Location.reverseGeocodeAsync({
            latitude,
            longitude
          });
          
          console.log('Geocoding response:', JSON.stringify(geocodingResponse, null, 2));
          
          if (geocodingResponse && geocodingResponse.length > 0) {
            const locationData = geocodingResponse[0];
            console.log('User location data:', JSON.stringify(locationData, null, 2));
            
            // Convert full country name to ISO country code
            let countryCode = "US"; // Default to US
            
            // Check if we already have an ISO country code from the geocoding response
            if (locationData.isoCountryCode) {
              countryCode = locationData.isoCountryCode;
              console.log('Using ISO country code from geocoding:', countryCode);
            } 
            // Otherwise, try to map from full country name
            else if (locationData.country) {
              // Simple mapping of common country names to codes
              const countryCodes = {
                "United States": "US",
                "United States of America": "US",
                "USA": "US",
                "Canada": "CA",
                "United Kingdom": "GB",
                "UK": "GB",
                "Australia": "AU",
                "Germany": "DE",
                "France": "FR",
                "Italy": "IT",
                "Spain": "ES",
                "Japan": "JP",
                "China": "CN",
                "India": "IN",
                "Brazil": "BR",
                "Mexico": "MX"
              };
              
              countryCode = countryCodes[locationData.country] || "US";
              console.log('Mapped country name to code:', locationData.country, '->', countryCode);
            }
            
            userLocationConfig = {
                  type: "approximate" as const,
                  country: countryCode,
                  city: locationData.city || locationData.subregion || "New York",
                  region: locationData.region || "New York"
            };
            
            console.log('Final location config for search:', JSON.stringify(userLocationConfig, null, 2));
        } else {
            console.log('No geocoding results returned, using default location');
          }
        } catch (error) {
          console.error('Error getting city from coordinates:', error);
          console.log('Falling back to default New York location');
        }
      } else {
        console.log('No user location available, using default New York location');
      }
    } else {
      // For movie-only queries, just use country-level location
      userLocationConfig = {
        type: "approximate" as const,
        country: "US",
        city: "United States", 
        region: "United States" 
      };
      console.log('Using country-level location for movie-only query:', JSON.stringify(userLocationConfig, null, 2));
    }

    const response = await openai.responses.create({
      model: "gpt-4o",
      tools: [{ 
        type: "web_search_preview",
        user_location: userLocationConfig,
        search_context_size: "medium"
      }],
      input: enhancedQuery,
      tool_choice: {type: "web_search_preview"}
    }) as any;
    
    console.log('RAW WEB SEARCH RESPONSE:', JSON.stringify(response, null, 2));
    
    // Extract the text from the response
    return extractTextFromResponse(response);
  } catch (error) {
    console.error('Error performing web search:', error);
    return null;
  }
}; 