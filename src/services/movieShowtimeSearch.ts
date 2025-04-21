import * as LocationService from "./location";
import OpenAI from 'openai';
import { OPENAI_CONFIG } from '../config/apiKeys';

// OpenAI API configuration with proper API key
const openai = new OpenAI(OPENAI_CONFIG);

export interface ShowtimeDetails {
  time: string;
  endTime?: string;
  date: string;
  theater: string;
  theaterId?: string;
  price: string;
  movieId?: string;
  movieTitle?: string;
  cinemaId?: string;
  cinemaAddress?: string;
  cinemaDistance?: string;
  format?: string;
  id?: string;
}

export interface CinemaShowtimeInfo {
  name: string;
  address: string;
  distance: string;
  ticketPrices: string;
  showtimes: ShowtimeDetails[];
}

// Helper function for date formatting that avoids timezone issues
const formatDateString = (dateString: string, format: string): string => {
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    console.error(`Invalid date string format: ${dateString}, expected YYYY-MM-DD`);
    return dateString; 
  }
  
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; 
  const day = parseInt(parts[2]);
  const date = new Date(year, month, day);
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  return format
    .replace('EEEE', dayNames[date.getDay()])
    .replace('MMMM', monthNames[date.getMonth()])
    .replace('d', date.getDate().toString())
    .replace('yyyy', date.getFullYear().toString())
    .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
    .replace('dd', date.getDate().toString().padStart(2, '0'));
};

// Extract text from OpenAI response
const extractTextFromResponse = (response: any): string => {
  console.log('Extracting text from response...');
  console.log('Response object type:', typeof response);
  console.log('Response has choices:', !!response?.choices);
  if (response?.choices) {
    console.log('Number of choices:', response.choices.length);
    console.log('First choice type:', typeof response.choices[0]);
  }
  
  if (response?.choices && response.choices[0]?.message?.tool_calls) {
    console.log('Found tool_calls in response - processing web search results');
    
    const toolCalls = response.choices[0].message.tool_calls;
    console.log('Number of tool calls:', toolCalls.length);
    
    if (toolCalls.length > 0) {
      console.log('First tool call type:', toolCalls[0].type);
      console.log('First tool call function name:', toolCalls[0].function?.name);
      
      if (toolCalls[0].function.name === 'web_search') {
        console.log('Web search tool call found');
        
        // Log tool call arguments
        if (toolCalls[0].function.arguments) {
          console.log('Web search tool call arguments:', toolCalls[0].function.arguments);
        }
        
        if (response.choices[0].message.content) {
          console.log('Tool call has message content, using that');
          return response.choices[0].message.content;
        }
        console.log('Web search initiated, but no content is available yet');
        return "Web search results pending. Please check direct search results for current showtimes.";
      }
    }
  }

  //handle different response structures for old and new Open AI API responses
  if (response?.choices && response.choices[0]?.message?.content) {
    const content = response.choices[0].message.content;
    console.log('Found content in standard chat completion response');
    return content;
  }
  
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
        console.log('RAW EXTRACTED RESPONSE TEXT (FIRST 200 CHARS):', text.substring(0, 200));
        return text;
      }
    }
  }
  
  if (response && response.content && Array.isArray(response.content)) {
    console.log('Found content array in response');
    for (const content of response.content) {
      if (content.type === 'text' && content.text) {
        console.log('Found text in content');
        console.log('RAW EXTRACTED RESPONSE TEXT (FIRST 200 CHARS):', content.text.substring(0, 200));
        return content.text;
      }
    }
  }
  
  if (response && response.choices && Array.isArray(response.choices) && response.choices.length > 0) {
    console.log('Found choices in response');
    const choice = response.choices[0];
    
    if (choice.message && typeof choice.message.content === 'string') {
      console.log('Found message.content in choices');
      console.log('RAW EXTRACTED RESPONSE TEXT (FIRST 200 CHARS):', choice.message.content.substring(0, 200));
      return choice.message.content;
    }
    
    if (choice.text && typeof choice.text === 'string') {
      console.log('Found text in choices');
      console.log('RAW EXTRACTED RESPONSE TEXT (FIRST 200 CHARS):', choice.text.substring(0, 200));
      return choice.text;
    }
  }
  
  console.log('Could not extract text from response');
  console.log('RAW RESPONSE STRUCTURE:', JSON.stringify(response).substring(0, 200));
  return "Could not retrieve response text";
};

export const MovieShowtimeAPI = {
  openai,
  
  getAIShowtimesForMovie: async (movieTitle: string, date?: string): Promise<{ 
    showtimes: ShowtimeDetails[], 
    noShowtimesAvailable: boolean,
    noShowtimesMessage?: string 
  }> => {
    try {
      console.log(`Requesting AI showtimes for movie: ${movieTitle}, date: ${date || 'today'}`);
      
      // Helper function to ensure we always get a local ISO date string
      const getLocalISODate = (override?: string): string => {
        if (override) return override;
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
      };
      
      const userLocation = await LocationService.getCurrentLocation();
      let city = 'New York';
      let region = 'NY';
      
      if (userLocation) {
        const addressInfo = await LocationService.getAddressFromCoordinates(userLocation.latitude, userLocation.longitude);
        if (addressInfo) {
          city = addressInfo.city || city;
          region = addressInfo.region || region;
          console.log(`Using user location: ${city}, ${region}`);
        }
      } else {
        console.log(`Using default location: ${city}, ${region}`);
      }
      
      // Format date using our helper function
      const dateString = getLocalISODate(date);
      console.log(`Using date string: ${dateString}`);
      
      const fullDateFormat = formatDateString(dateString, 'MMMM d, yyyy');
      const dayName = formatDateString(dateString, 'EEEE');
      const shortDate = formatDateString(dateString, 'MMM d');
      
      console.log(`Formatted date: ${fullDateFormat} (${dayName}), short format: ${shortDate}`);
      
      const prompt = `Please provide accurate showtimes for the movie "${movieTitle}" on ${fullDateFormat} (${dayName}, ${date}) in or near ${city}, ${region}.
      
I need showtimes SPECIFICALLY for ${dayName}, ${fullDateFormat}, not any other date.

FORMAT REQUIREMENT: Follow this EXACT format with no modifications to the section headers:

## [CINEMA] Theater Name (distance)
**Address:** Full address including any brand name (AMC, Regal, Cinemark, etc.)
**Ticket Prices:** Average price
   
## [SHOWTIMES FOR ${fullDateFormat}] 
- 10:15 AM ($12.99) [Standard]
- 1:30 PM ($14.99) [IMAX]
- 4:45 PM ($12.99) [Standard]

IMPORTANT: Use EXACTLY "## [CINEMA]" as the header (do not replace CINEMA with brand names).
Include the brand name (AMC, Regal, etc.) as part of the theater name after the header.

Include multiple theaters if available. If no showtimes are available, please explain why.`;

      console.log(`AI Prompt: ${prompt.substring(0, 200)}...`);
      console.log('Making OpenAI API call for showtimes...');
      console.log(`Using city: ${city}, region: ${region} in the prompt`);

      // Configure user location for the web search
      let userLocationConfig = {
        type: "approximate" as const,
        country: "US",
        city: city,
        region: region
      };
      
      const response = await openai.responses.create({
        model: "gpt-4o",
        tools: [{ 
          type: "web_search_preview",
          user_location: userLocationConfig,
          search_context_size: "medium"
        }],
        input: prompt,
        tool_choice: {type: "web_search_preview"}
      }) as any;
      
      console.log('OpenAI API call completed');
      console.log('COMPLETE RAW RESPONSE:', JSON.stringify(response, null, 2));
      
      // Get output_text from the response
      let responseText = '';
      if (response && response.output_text) {
        console.log('Using output_text from response');
        responseText = response.output_text;
      } else {
        // Fallback to extractTextFromResponse for other response formats
        responseText = extractTextFromResponse(response);
      }
      
      console.log('EXTRACTED TEXT (FULL):');
      console.log(responseText);
      console.log('Raw response content length:', responseText.length);
      console.log('Response first 200 chars:', responseText.substring(0, 200));
      
      // Check if the movie is not showing
      const notShowingPatterns = [
        /not (currently )?(scheduled|showing|playing|available)/i,
        /no showtimes (available|found)/i,
        /isn't playing/i,
        /isn't (currently )?scheduled/i,
        /doesn't have any (scheduled )?showtimes/i
      ];
      
      const isNotShowing = notShowingPatterns.some(pattern => {
        const matches = pattern.test(responseText);
        if (matches) {
          console.log(`Matched "not showing" pattern: ${pattern}`);
        }
        return matches;
      });
      
      if (isNotShowing) {
        console.log('Movie is not currently showing according to AI');
        return {
          showtimes: [],
          noShowtimesAvailable: true,
          noShowtimesMessage: 'No showtimes found for this movie in your area. It may not be currently showing or may be available at a later date.'
        };
      }
      
      console.log('Parsing AI response for cinema and showtime information...');
      const cinemaShowtimes = parseAIShowtimeResponse(responseText, movieTitle, dateString);
      
      console.log(`Parsed ${cinemaShowtimes.length} cinemas from AI response`);
      if (cinemaShowtimes.length > 0) {
        console.log('First cinema:', JSON.stringify(cinemaShowtimes[0], null, 2));
      }
      
      if (cinemaShowtimes.length === 0) {
        console.log('Failed to parse any cinema showtimes from AI response');
        return {
          showtimes: [],
          noShowtimesAvailable: true,
          noShowtimesMessage: 'Unable to find any current showtimes for this movie in your area. The movie may not be showing yet.'
        };
      }
      
      const formattedShowtimes: ShowtimeDetails[] = [];
      
      cinemaShowtimes.forEach((cinema, cinemaIndex) => {
        const theaterId = `ai-${cinema.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
        
        cinema.showtimes.forEach((showtime, showtimeIndex) => {
          formattedShowtimes.push({
            id: `ai-${theaterId}-${dateString}-${showtimeIndex}`,
            movieId: `ai-movie-${movieTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
            movieTitle: movieTitle,
            theater: cinema.name,
            theaterId: theaterId,
            date: dateString,
            time: showtime.time,
            endTime: showtime.endTime,
            price: showtime.price,
            format: showtime.format,
            cinemaId: theaterId,
            cinemaAddress: cinema.address,
            cinemaDistance: cinema.distance
          });
        });
      });
      
      console.log(`Generated ${formattedShowtimes.length} formatted showtimes`);
      
      formattedShowtimes.sort((a, b) => {
        return a.time.localeCompare(b.time);
      });
      
      return {
        showtimes: formattedShowtimes,
        noShowtimesAvailable: formattedShowtimes.length === 0
      };
    } catch (error) {
      console.error(`Error fetching AI showtimes for movie ${movieTitle}:`, error);
      return {
        showtimes: [],
        noShowtimesAvailable: true,
        noShowtimesMessage: 'Unable to retrieve showtimes at this moment. Please try again later.'
      };
    }
  },
  
  getAIShowtimesForCinema: async (
    cinemaName: string, 
    date: string
  ): Promise<{
    showtimes: ShowtimeDetails[],
    noShowtimesAvailable: boolean,
    noShowtimesMessage?: string
  }> => {
    console.log(`Getting AI showtimes for cinema: ${cinemaName}, date: ${date}`);
    try {
      // Get user's current location
      const currentLocation = await LocationService.getCurrentLocation();
      const userLocation = `${currentLocation?.latitude || ''}, ${currentLocation?.longitude || ''}`;
      console.log(`User location for cinema showtimes: ${userLocation}`);
      
      let city = "New York";
      let region = "NY";
      
      if (currentLocation) {
        try {
          const addressInfo = await LocationService.getAddressFromCoordinates(
            currentLocation.latitude, 
            currentLocation.longitude
          );
          
          if (addressInfo) {
            city = addressInfo.city || city;
            region = addressInfo.region || region;
            console.log(`Using city: ${city}, region: ${region} for cinema search`);
          }
        } catch (error) {
          console.log('Error getting address info:', error);
        }
      }
      
      console.log(`Formatting date: ${date} for AI prompt`);
      const fullDateFormat = formatDateString(date, 'MMMM d, yyyy');
      const dayName = formatDateString(date, 'EEEE');
      
      console.log(`Formatted date values: day=${dayName}, full=${fullDateFormat}`);

      const prompt = `Please provide accurate showtimes for all movies playing at "${cinemaName}" theater on ${fullDateFormat} (${dayName}, ${date}) in or near ${city}, ${region}.

I need showtimes SPECIFICALLY for ${dayName}, ${fullDateFormat}, not any other date.

FORMAT REQUIREMENT: Follow this EXACT format with no modifications to the section headers:

## [CINEMA] ${cinemaName}
**Address:** Full address including any brand name (AMC, Regal, Cinemark, etc.)
**Ticket Prices:** Average prices

## [MOVIE] Movie Title 1
**Showtimes for ${fullDateFormat}:**
- 10:15 AM ($12.99) [Standard]
- 1:30 PM ($14.99) [IMAX]

## [MOVIE] Movie Title 2
**Showtimes for ${fullDateFormat}:**
- 11:00 AM ($12.99) [Standard]
- 2:15 PM ($12.99) [Standard]

IMPORTANT: Use EXACTLY "## [CINEMA]" as the header (do not replace CINEMA with brand names). 
Include the brand name (AMC, Regal, etc.) as part of the cinema name after the header.

If you can't find this exact cinema, suggest the closest match. If no showtimes are available, please explain why.`;

      const response = await openai.responses.create({
        model: "gpt-4o",
        tools: [{ 
          type: "web_search_preview",
          user_location: {
            type: "approximate" as const,
            country: "US",
            city: city,
            region: region
          },
          search_context_size: "medium"
        }],
        input: prompt,
        tool_choice: {type: "web_search_preview"}
      }) as any;
      
      console.log('OpenAI API call for cinema completed');
      console.log('COMPLETE RAW CINEMA RESPONSE:', JSON.stringify(response, null, 2));
      
      // Get output_text from the response
      let responseText = '';
      if (response && response.output_text) {
        console.log('Using output_text from response');
        responseText = response.output_text;
      } else {
        // Fallback to extractTextFromResponse for other response formats
        responseText = extractTextFromResponse(response);
      }
      
      console.log('EXTRACTED CINEMA RESPONSE TEXT (FULL):');
      console.log(responseText);

      // Extract cinema and movie showtimes
      const cinema = extractCinemaMovieShowtimes(responseText, cinemaName, date);
      
      if (!cinema) {
        console.log('No cinema information extracted from response');
        return {
          showtimes: [],
          noShowtimesAvailable: true,
          noShowtimesMessage: `No showtimes found for ${cinemaName} on the selected date.`
        };
      }
      
      console.log(`Extracted cinema: ${cinema.name}`);
      console.log(`Extracted ${cinema.showtimes.length} showtimes`);
      
      const showtimesWithIds = cinema.showtimes.map((showtime, index) => ({
        ...showtime,
        id: `ai-cinema-${Date.now()}-${index}`,
        cinemaAddress: cinema.address,
        cinemaDistance: cinema.distance
      }));
      
      return {
        showtimes: showtimesWithIds,
        noShowtimesAvailable: showtimesWithIds.length === 0
      };
    } catch (error) {
      console.error('Error getting AI showtimes for cinema:', error);
      return {
        showtimes: [],
        noShowtimesAvailable: true,
        noShowtimesMessage: 'Unable to retrieve showtimes. Please try again later.'
      };
    }
  }
};

export const parseAIShowtimeResponse = (
  text: string,
  movieTitle: string,
  date: string
): CinemaShowtimeInfo[] => {
  console.log('Parsing AI showtime response...');
  if (!text) {
    console.log('Empty response text');
    return [];
  }
  
  const cinemas: CinemaShowtimeInfo[] = [];
  const cinemaSections = text.split(/##\s*\[CINEMA\]/);
  
  console.log(`Found ${cinemaSections.length - 1} cinema sections in response`);
  
  for (const section of cinemaSections.slice(1)) {
    try {
      const cinemaNameMatch = section.match(/^\s*([^(]+?)(?:\s*\(|$)/);
      const distanceMatch = section.match(/\(([^)]*?(?:\d+(?:\.\d+)?\s*(?:miles|mi|km))[^)]*)\)/);
      const addressMatch = section.match(/\*\*Address:\*\*\s*([^\n]+)/i);
      const ticketPriceMatch = section.match(/\*\*Ticket Prices?:\*\*\s*([^\n]+)/i);
      let showtimesMatch = section.match(/##\s*\[SHOWTIMES(?:\s+FOR\s+[^\]]+)?\]([\s\S]+?)(?=\n\s*\n\s*##|\n\s*\n\s*$|$)/i);

      if (!showtimesMatch) {
        showtimesMatch = section.match(/\*\*Ticket Prices?:.*?\n([\s\S]+?)(?=\n\s*\n\s*##|\n\s*\n\s*$|$)/i);
        if (!showtimesMatch && addressMatch && ticketPriceMatch) {
          const afterPrices = section.substring(section.indexOf(ticketPriceMatch[0]) + ticketPriceMatch[0].length);
          showtimesMatch = [null, afterPrices.trim()];
        }
      }
      
      if (cinemaNameMatch) {
        const cinemaName = cinemaNameMatch[1].trim();
        const distance = distanceMatch ? distanceMatch[1].trim() : '';
        const address = addressMatch ? addressMatch[1].trim() : '';
        const ticketPrices = ticketPriceMatch ? ticketPriceMatch[1].trim() : '$12.99';
        const showtimesText = showtimesMatch ? showtimesMatch[1].trim() : '';
        
        console.log(`Processing cinema: ${cinemaName}`);
        console.log(`Address: ${address}`);
        console.log(`Distance: ${distance}`);
        console.log(`Ticket prices: ${ticketPrices}`);
        console.log(`Showtimes text (first 100 chars): ${showtimesText.substring(0, 100)}`);

        const showtimes = extractSimpleShowtimes(showtimesText, cinemaName, movieTitle, date);
        
        console.log(`Extracted ${showtimes.length} showtimes for ${cinemaName}`);
        
        cinemas.push({
          name: cinemaName,
          address,
          distance,
          ticketPrices,
          showtimes
        });
      }
    } catch (error) {
      console.error('Error processing cinema section:', error);
    }
  }

  if (cinemas.length === 0) {
    console.log('No cinemas found with structured format. Trying fallback parsing.');
    return fallbackParseAIShowtimeResponse(text, movieTitle, date);
  }
  
  return cinemas;
};

export const calculateEndTime = (time: string): string => {
  try {
    const parts = time.match(/(\d+):(\d+)\s*([AP]M)?/i);
    if (!parts) return '';
    
    let hours = parseInt(parts[1]);
    const minutes = parseInt(parts[2]);
    const ampm = parts[3]?.toUpperCase() || '';

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    // Add 2 hours (average movie length)
    hours = (hours + 2) % 24;
    const isPM = hours >= 12;
    hours = hours % 12 || 12;
    
    return `${hours}:${minutes.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
  } catch (error) {
    console.error('Error calculating end time:', error);
    return '';
  }
};

// Fallback parsing for AI showtime response, in case AI doesn't return structured data
export const fallbackParseAIShowtimeResponse = (
  text: string,
  movieTitle: string,
  date: string
): CinemaShowtimeInfo[] => {
  console.log('Using fallback parsing for AI showtime response...');
  const cinemas: CinemaShowtimeInfo[] = [];
  
  // Split by lines
  const lines = text.split('\n');
  
  let currentCinema: CinemaShowtimeInfo | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;
    
    // Check if line contains a cinema name
    if (line.includes(':') && !line.startsWith('*') && !line.startsWith('#')) {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const cinemaName = parts[0].trim();
        
        // Extract distance if present
        const distanceMatch = cinemaName.match(/\(([^)]+)\)/);
        const distance = distanceMatch ? distanceMatch[1].trim() : '';
        
        // Check next lines for address
        let address = '';
        if (i + 1 < lines.length && lines[i + 1].toLowerCase().includes('address')) {
          address = lines[i + 1].split(':')[1]?.trim() || '';
        }
        
        // Check for ticket prices
        let ticketPrices = '$12.99';
        if (i + 2 < lines.length && lines[i + 2].toLowerCase().includes('price')) {
          ticketPrices = lines[i + 2].split(':')[1]?.trim() || '$12.99';
        }
        
        // Create new cinema object
        currentCinema = {
          name: cinemaName.replace(/\([^)]+\)/, '').trim(),
          address,
          distance,
          ticketPrices,
          showtimes: []
        };
        
        cinemas.push(currentCinema);
        
        // Extract showtimes from this line
        const showtimesText = parts.slice(1).join(':').trim();
        if (showtimesText) {
          const extractedShowtimes = extractSimpleShowtimes(showtimesText, currentCinema.name, movieTitle, date);
          currentCinema.showtimes.push(...extractedShowtimes);
        }
      }
    } else if (line.match(/\d{1,2}:\d{2}\s*[AP]M/i) && currentCinema) {
      const extractedShowtimes = extractSimpleShowtimes(line, currentCinema.name, movieTitle, date);
      currentCinema.showtimes.push(...extractedShowtimes);
    }
  }
  
  return cinemas;
};

export const extractSimpleShowtimes = (
  text: string,
  theaterName: string,
  movieTitle: string,
  date: string
): ShowtimeDetails[] => {
  console.log(`Extracting simple showtimes from text for ${theaterName}: ${text.substring(0, 100)}...`);
  const showtimes: ShowtimeDetails[] = [];
  
  // Only mark as "no showtimes" if the entire section explicitly says that
  // This regex is more restrictive to avoid false positives
  const noShowtimesRegex = /^\s*(?:no (?:specific |particular )?showtimes (?:are )?available|no showtimes (?:were )?found)\s*(?:for (?:this|the) (?:movie|film|cinema))?\.?\s*$/i;
  
  if (noShowtimesRegex.test(text.trim())) {
    console.log(`No specific showtimes available for ${theaterName} - explicit message found`);
    return [{
      time: "No showtimes available",
      endTime: "",
      date: date,
      theater: theaterName,
      price: 'Check theater',
      movieTitle,
      format: 'N/A'
    }];
  }
  
  // Enhanced time regex to handle various time formats
  // Handles cases like "10:30 AM", "10:30AM", "10:30am ($12.99)", "10:30 AM [IMAX]", etc.
  const timeRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm))(?:\s*\(?\$?(\d+(?:\.\d+)?)\)?)?(?:\s*\[([^\]]+)\])?/gi;
  let match;
  
  while ((match = timeRegex.exec(text)) !== null) {
    try {
      // Extract and normalize time (first capturing group)
      let standardTime = match[1].trim().toUpperCase();
      // Ensure proper spacing between time and AM/PM
      standardTime = standardTime.replace(/([AP]M)$/i, ' $1');
      standardTime = standardTime.replace(/\s+/g, ' ');
      
      // Add colon if missing (convert "2PM" to "2:00 PM")
      if (!standardTime.includes(':')) {
        const hourPart = standardTime.match(/(\d+)/)[1];
        standardTime = `${hourPart}:00${standardTime.substring(hourPart.length)}`;
      }
      
      // Extract price (second capturing group)
      const price = match[2] ? `$${match[2]}` : '$12.99';
      
      // Extract format (third capturing group) 
      const format = match[3] ? match[3].trim() : 'Standard';
      
      // Calculate end time
      const endTime = calculateEndTime(standardTime);
      
      // Set distance based on theaterName if it contains distance information
      const distanceMatch = theaterName.match(/\(([^)]*?(?:\d+(?:\.\d+)?\s*(?:miles|mi|km))[^)]*)\)/);
      const distance = distanceMatch ? 
                       distanceMatch[1].trim() : 
                       theaterName.includes('miles') ? theaterName.split('(')[1]?.split(')')[0] : '2-5 miles';
      
      showtimes.push({
        time: standardTime,
        endTime,
        date: date,
        theater: theaterName.replace(/\s*\([^)]*\)$/, '').trim(), // Remove distance from theater name
        price,
        movieTitle,
        format,
        cinemaDistance: distance
      });
    } catch (error) {
      console.error('Error processing time match:', error);
    }
  }
  
  // Also look for bullet point format with times
  if (showtimes.length === 0) {
    const bulletPointRegex = /-\s*([^-\n]+)/g;
    let bulletMatch;
    
    while ((bulletMatch = bulletPointRegex.exec(text)) !== null) {
      const bulletContent = bulletMatch[1].trim();
      
      // Look for time patterns in the bullet point with more flexibility
      const timeMatch = bulletContent.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
      
      if (timeMatch) {
        try {
          // Format time properly
          let standardTime = timeMatch[1].trim().toUpperCase();
          standardTime = standardTime.replace(/([AP]M)$/i, ' $1');
          standardTime = standardTime.replace(/\s+/g, ' ');
          
          // Add colon if missing
          if (!standardTime.includes(':')) {
            const hourPart = standardTime.match(/(\d+)/)[1];
            standardTime = `${hourPart}:00${standardTime.substring(hourPart.length)}`;
          }
          
          // Extract price if available - look for dollar values
          const priceMatch = bulletContent.match(/\$(\d+(?:\.\d+)?)/i);
          const price = priceMatch ? `$${priceMatch[1]}` : '$12.99';
          
          // Extract format if available - look for text in brackets
          const formatMatch = bulletContent.match(/\[([^\]]+)\]/i);
          const format = formatMatch ? formatMatch[1] : 
                        bulletContent.includes("IMAX") ? "IMAX" :
                        bulletContent.includes("3D") ? "3D" : 'Standard';
          
          // Calculate end time
          const endTime = calculateEndTime(standardTime);
          
          // Extract distance
          const distanceMatch = theaterName.match(/\(([^)]*?(?:\d+(?:\.\d+)?\s*(?:miles|mi|km))[^)]*)\)/);
          const distance = distanceMatch ? distanceMatch[1].trim() : '2-5 miles';
          
          showtimes.push({
            time: standardTime,
            endTime,
            date: date,
            theater: theaterName.replace(/\s*\([^)]*\)$/, '').trim(), // Remove distance from theater name
            price,
            movieTitle,
            format,
            cinemaDistance: distance
          });
        } catch (error) {
          console.error('Error processing bullet point time match:', error);
        }
      }
    }
  }
  
  // If still no showtimes found, look more aggressively for time patterns
  if (showtimes.length === 0) {
    // Broader time pattern matching
    const looseTimeRegex = /\b(\d{1,2}[:.]?\d{0,2}\s*(?:am|pm))\b/gi;
    let looseMatch;
    
    while ((looseMatch = looseTimeRegex.exec(text)) !== null) {
      try {
        let time = looseMatch[1].toUpperCase();
        
        // Normalize time format
        time = time.replace(/\./g, ':');  // Replace periods with colons
        time = time.replace(/([AP]M)$/i, ' $1');  // Add space before AM/PM
        
        // Add colon if missing
        if (!time.includes(':')) {
          const hourPart = time.match(/(\d+)/)[1];
          time = `${hourPart}:00${time.substring(hourPart.length)}`;
        }
        
        showtimes.push({
          time: time.trim(),
          endTime: calculateEndTime(time),
          date: date,
          theater: theaterName.replace(/\s*\([^)]*\)$/, '').trim(),
          price: '$12.99',
          movieTitle,
          format: 'Standard',
          cinemaDistance: '2-5 miles'
        });
      } catch (error) {
        console.error('Error processing loose time match:', error);
      }
    }
  }
  
  // Sort showtimes by time
  showtimes.sort((a, b) => {
    return a.time.localeCompare(b.time);
  });
  
  return showtimes;
};

export const extractCinemaMovieShowtimes = (
  text: string,
  cinemaName: string,
  date: string
): CinemaShowtimeInfo | null => {
  console.log(`Extracting cinema and movie showtimes for ${cinemaName}`);
  
  if (!text || !cinemaName) {
    console.log('Empty response text or missing cinema name');
    return null;
  }
  
  try {
    // Extract cinema details
    const cinemaSection = text.match(/##\s*\[CINEMA\]([\s\S]+?)(?=##\s*\[MOVIE\]|$)/i);
    
    if (!cinemaSection) {
      console.log('No cinema section found');
      return null;
    }
    
    const cinemaDetails = cinemaSection[1];
    
    // Extract cinema name
    const cinemaNameMatch = cinemaDetails.match(/^\s*([^(]+?)(?:\s*\(|$)/m);
    
    // Extract distance if available
    const distanceMatch = cinemaDetails.match(/\(([^)]*?(?:\d+(?:\.\d+)?\s*(?:miles|mi|km))[^)]*)\)/);
    
    // Extract address
    const addressMatch = cinemaDetails.match(/\*\*Address:\*\*\s*([^\n]+)/i);
    
    // Extract ticket prices
    const ticketPriceMatch = cinemaDetails.match(/\*\*Ticket Prices?:\*\*\s*([^\n]+)/i);
    
    // Create cinema object
    const cinema: CinemaShowtimeInfo = {
      name: cinemaNameMatch ? cinemaNameMatch[1].trim() : cinemaName,
      address: addressMatch ? addressMatch[1].trim() : '',
      distance: distanceMatch ? distanceMatch[1].trim() : '',
      ticketPrices: ticketPriceMatch ? ticketPriceMatch[1].trim() : '$12.99',
      showtimes: []
    };
    
    // Extract movie sections
    const movieSections = text.match(/##\s*\[MOVIE\]([\s\S]+?)(?=##\s*\[MOVIE\]|$)/g);
    
    if (!movieSections || movieSections.length === 0) {
      console.log('No movie sections found');
      return cinema;
    }
    
    // Process each movie section
    for (const section of movieSections) {
      // Extract movie title
      const movieTitleMatch = section.match(/##\s*\[MOVIE\]\s*([^\n]+)/);
      
      if (movieTitleMatch) {
        const movieTitle = movieTitleMatch[1].trim();
        
        // Extract showtimes for this movie
        const movieShowtimes = extractMovieShowtimes(section, cinema.name, movieTitle, date);
        
        // Add to cinema showtimes
        cinema.showtimes.push(...movieShowtimes);
      }
    }
    
    return cinema;
  } catch (error) {
    console.error('Error extracting cinema movie showtimes:', error);
    return null;
  }
};

export const extractMovieShowtimes = (
  text: string,
  cinemaName: string,
  movieTitle: string,
  date: string
): ShowtimeDetails[] => {
  console.log(`Extracting movie showtimes for "${movieTitle}" at ${cinemaName}`);
  
  if (!text || !movieTitle || !cinemaName) {
    console.log('Missing required parameters for extraction');
    return [];
  }
  
  // Find the movie section
  const movieSectionRegex = new RegExp(`## \\[MOVIE\\]\\s*${movieTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]+?)(?=## \\[MOVIE\\]|$)`, 'i');
  const movieSection = text.match(movieSectionRegex);
  
  if (!movieSection) {
    console.log(`No section found for movie "${movieTitle}"`);
    return [];
  }
  
  const showtimesSection = movieSection[1];
  
  // Extract showtimes
  const showtimesMatch = showtimesSection.match(/\*\*Showtimes[^:]*:?\*\*\s*([^\n]+)/i);
  if (!showtimesMatch) {
    console.log('No showtimes found in the movie section');
    return [];
  }
  
  const showtimesText = showtimesMatch[1].trim();
  
  // Parse individual showtimes
  return extractSimpleShowtimes(showtimesText, cinemaName, movieTitle, date);
}; 