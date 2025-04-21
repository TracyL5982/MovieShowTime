import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Keyboard, 
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ScrollView,
  LayoutChangeEvent,
  ActivityIndicator,
  StyleSheet,
  Pressable
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  setResponse, 
  addMessageToHistory, 
  clearConversationHistory,
  setChatboxHeight,
  ChatMessage,
  updateMessageInHistory,
  setStructuredCinemaData
} from '../store/aiSlice';
import { searchMovies, clearSearchResults } from '../store/movieSlice';
import { useNavigation, NavigationProp, ParamListBase, useFocusEffect } from '@react-navigation/native';
import OpenAI from 'openai';
import { styles, inputTheme, loadingInputTheme, keyboardAvoidingViewProps, ICON_CONFIG } from '../styles/AIChatBox.styles';
import { COLORS, RADIUS } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import VoiceInput from './AIChat/VoiceInput';
import TextToSpeech from './AIChat/TextToSpeech';
import { OPENAI_CONFIG, SCREEN_TYPES, SHOWTIMES_KEYWORDS, SEARCH_QUERY_KEYWORDS, EXPANDED_STATE_KEY, MovieInfo } from './AIChat/types';

const openai = new OpenAI(OPENAI_CONFIG);

const AIChatBox: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { isVisible, response, conversationHistory } = useSelector((state: RootState) => state.ai);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [pendingInput, setPendingInput] = useState('');
  const [responseHeight, setResponseHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    const loadExpandedState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(EXPANDED_STATE_KEY);
        if (savedState !== null) {
          setIsExpanded(savedState === 'true');
          console.log('Loaded AI chatbox expanded state:', savedState === 'true');
        }
      } catch (error) {
        console.error('Error loading AI chatbox expanded state:', error);
      }
    };

    loadExpandedState();
  }, []);

  useEffect(() => {
    if (!response && isVisible && conversationHistory.length === 0) {
      dispatch(setResponse('Hi there! How can I help you find movies or showtimes today?'));
    }
  }, [response, isVisible, dispatch, conversationHistory.length]);

  useEffect(() => {
    if (conversationHistory.length > 0 && !isLoading) {
      const lastMessageIndex = conversationHistory.length - 1;
      const lastMessage = conversationHistory[lastMessageIndex];
      
      console.log('Message processing check:', {
        lastMessageIndex,
        lastProcessedIndex: lastProcessedIndex.current,
        lastMessageRole: lastMessage.role,
        isLoading
      });
      
      if (lastMessage.role === 'user' && 
          lastMessageIndex > lastProcessedIndex.current) {
        
        console.log('Processing new user message:', lastMessage.content);
        lastProcessedIndex.current = lastMessageIndex;
        
        if (lastMessageIndex === 0 || conversationHistory[lastMessageIndex - 1]?.role === 'assistant') {
          handleSubmit(lastMessage.content);
        }
      }
    }
  }, [conversationHistory, isLoading]);

  useEffect(() => {
    if (response) {
      setResponseHeight(0);
      setContainerHeight(0);
    }
  }, [response]);

  useEffect(() => {
    if (isKeyboardVisible) {
      setIsExpanded(false);
    } else {
      const restoreSavedState = async () => {
        try {
          const savedState = await AsyncStorage.getItem(EXPANDED_STATE_KEY);
          if (savedState !== null) {
            setIsExpanded(savedState === 'true');
          }
        } catch (error) {
          console.error('Error restoring AI chatbox state after keyboard dismiss:', error);
        }
      };
      
      restoreSavedState();
    }
  }, [isKeyboardVisible]);
  
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        setKeyboardVisible(true);
        setKeyboardHeight(event.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission not granted');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    };

    getLocation();
  }, []);

  useEffect(() => {
    if (responseHeight > 0 && containerHeight > 0) {

      setShouldShowToggle(true);
      console.log('Always allowing expand/collapse');
    }
  }, [responseHeight, containerHeight]);


  useFocusEffect(
    React.useCallback(() => {
      const reloadExpandedState = async () => {
        try {
          const savedState = await AsyncStorage.getItem(EXPANDED_STATE_KEY);
          if (savedState !== null) {
            setIsExpanded(savedState === 'true');
            console.log('Restored AI chatbox state on screen focus:', savedState === 'true');
          }
        } catch (error) {
          console.error('Error loading AI chatbox state on focus:', error);
        }
      };

      if (response && shouldShowToggle) {
        reloadExpandedState();
      }

      return () => {
      };
    }, [response, shouldShowToggle])
  );

  const extractEntitiesFromResponse = async (response) => {
    try {
      const movieTitles = [];
      const movieTagRegex = /\[MOVIE\](.*?)\((\d{4})\)\[\/MOVIE\]/g;
      let match;
      
      while ((match = movieTagRegex.exec(response)) !== null) {
        const title = match[1].trim();
        const year = match[2];
        movieTitles.push(`${title} (${year})`);
      }
      
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

  /**
   * Unified method to determine the user intent and appropriate screen type
   * Combines rule-based detection and LLM-based classification
   * @param userQuery The user's query
   * @returns Object containing screen type and whether web search should be used
   */
  const determineUserIntent = async (userQuery: string): Promise<{screenType: string, useWebSearch: boolean}> => {
    const lowercaseQuery = userQuery.toLowerCase();
    let screenType = '';
    let useWebSearch = false;
    
    if (SHOWTIMES_KEYWORDS.some(keyword => lowercaseQuery.includes(keyword))) {
      console.log('Rule-based detection: MOVIE_SHOWTIMES');
      screenType = SCREEN_TYPES.MOVIE_SHOWTIMES;
      useWebSearch = true;
    }
    
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
    
    else if (lowercaseQuery.includes('closest cinema') || 
        lowercaseQuery.includes('cinemas near me') || 
        lowercaseQuery.includes('theaters near me') || 
        lowercaseQuery.includes('cinemas around')) {
      console.log('Rule-based detection: CINEMA_GALLERY');
      screenType = SCREEN_TYPES.CINEMA_GALLERY;
      useWebSearch = true;
    }
    
    else if (lowercaseQuery.includes('go home') ||
        lowercaseQuery.includes('start screen') ||
        lowercaseQuery.includes('main menu') ||
        lowercaseQuery.includes('go back to start')) {
      console.log('Rule-based detection: START_SCREEN');
      screenType = SCREEN_TYPES.START_SCREEN;
      useWebSearch = false;
    }
    
    else if (SEARCH_QUERY_KEYWORDS.some(keyword => lowercaseQuery.includes(keyword))) {
      console.log('General movie/cinema query detected, will use web search');
      useWebSearch = true;
    }
    
    if (!screenType && lowercaseQuery.length > 5) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
              content: `You are an AI assistant for a movie showtime app. Be concise. Based on the user's query, determine which screen should be shown.
            Return ONLY one of the following screen types with NO additional text. Find data corresponding to the user's query:
            - ${SCREEN_TYPES.MOVIE_GALLERY} - if the user wants to see a list of movies (e.g., "what movies are playing", "show me movies in theaters")
            - ${SCREEN_TYPES.MOVIE_DETAILS} - if the user wants details about a specific movie (e.g., "tell me about Dune", "show information for Godzilla x Kong")
            - ${SCREEN_TYPES.CINEMA_GALLERY} - if the user wants to see cinemas/theaters (e.g., "show me nearby theaters", "what cinemas are close to me")
            - ${SCREEN_TYPES.CINEMA_DETAILS} - if the user wants to see details about a specific cinema (e.g., "tell me about AMC Empire 25", "show information for Regal Cinemas")
            - ${SCREEN_TYPES.MOVIE_SHOWTIMES} - if the user wants showtimes for a movie (e.g., "when is Dune playing", "showtimes for Godzilla")
            - ${SCREEN_TYPES.START_SCREEN} - if the user wants to go to the home screen or start over (e.g., "go home", "start screen", "main menu")
            
            If the query doesn't clearly match any of the screens, don't return any screen type. In these cases, just respond conversationally to the user without changing screens.
            `
          },
          { role: 'user', content: userQuery }
        ],
        temperature: 0.1,
          max_tokens: 500,
        });

        const detectedScreenType = completion.choices[0].message.content.trim();
        
        const validScreenTypes = Object.values(SCREEN_TYPES);
        if (validScreenTypes.includes(detectedScreenType)) {
          screenType = detectedScreenType;
          console.log('API-based detection:', screenType);
          
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

  /**
   * Unified approach to extract a movie title from user queries and text
   * Consolidates functionality from multiple extraction methods
   * @param text The text to extract movie titles from (query or response)
   * @param isUserQuery Whether this is a user query (affects extraction patterns)
   * @returns The movie title if found, or null if not found
   */
  const extractMovieTitle = (text: string, isUserQuery: boolean = true): string | null => {
    if (!text) return null;
    
    const lowercaseText = text.toLowerCase();
    
    if (isUserQuery) {
      const patterns = [
        /(?:show|get|find|view)\s+(?:me\s+)?(?:the\s+)?showtimes\s+(?:for\s+)?(?:the\s+movie\s+)?["']?([^"']+?)["']?(?:\s+movie)?(?:\s+today|\s+in\s+theaters|\s+near\s+me)?$/i,
        /(?:what\s+are\s+the\s+)?showtimes\s+(?:for\s+)?(?:the\s+movie\s+)?["']?([^"']+?)["']?(?:\s+movie)?(?:\s+today|\s+near\s+me)?/i,
        /when\s+is\s+["']?([^"']+?)["']?\s+(?:movie\s+)?(?:showing|playing)(?:\s+today|\s+near\s+me)?/i,
        /["']?([^"']+?)["']?\s+(?:movie\s+)?showtimes/i,
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const title = match[1].trim()
            .replace(/^the\s+movie\s+/i, '')
            .replace(/[\.,\?!]$/, '');
          
          return title.trim() || null;
        }
      }
      
      return null;
    }
    
    const movieTagRegex = /\[MOVIE\](.*?)\((\d{4})\)\[\/MOVIE\]/;
    const tagMatch = text.match(movieTagRegex);
    
    if (tagMatch && tagMatch[1] && tagMatch[2]) {
      const title = tagMatch[1].trim();
      const year = tagMatch[2];
      return `${title} (${year})`;
    }
    
    const yearPatterns = [
      /([^:()\[\]]+)\s*\((\d{4})\)/,      
      /^\d+\.?\s+([^(]+)\s*\((\d{4})\)/,  
      /[•\-\*]\s*([^(]+)\s*\((\d{4})\)/   
    ];
    
    for (const pattern of yearPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[2]) {
        const title = match[1].trim()
          .replace(/"/g, '')
          .replace(/\*+/g, '')
          .trim();
        const year = match[2];
        
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

  const extractCinemaName = async (userQuery) => {
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


  
  const isGenericShowtimeQuery = (query: string): boolean => {
    const lowercaseQuery = query.toLowerCase();
    
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

  const extractMovieTitlesFromSearchResponse = (responseText: string): MovieInfo[] => {
    if (!responseText) return [];
    
    console.log('Extracting movie titles from response:', responseText.substring(0, 200));
    const movieInfoList: MovieInfo[] = [];
    
    try {
      const movieTagRegex = /\[MOVIE\](.*?)\((\d{4})\)\[\/MOVIE\]/g;
      let match;
      
      while ((match = movieTagRegex.exec(responseText)) !== null) {
        const title = match[1].trim();
        const year = match[2];
        const fullTitle = `${title} (${year})`;
        
        console.log('Found movie with tag format:', fullTitle);
        const existingIndex = movieInfoList.findIndex(m => 
          m.title.toLowerCase() === title.toLowerCase() && m.year === year
        );
        
        if (existingIndex === -1 && title && title.length > 2) {
          movieInfoList.push({ title, year, fullTitle });
        }
      }
      
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

  const requestStructuredCinemaData = async (query: string): Promise<string> => {
    try {
      console.log('Requesting structured cinema data for query:', query);

      let locationContext = "New York, NY";

      if (userLocation && userLocation.coords) {
        try {
          const { latitude, longitude } = userLocation.coords;
          console.log('User coordinates:', latitude, longitude);
          
          const geocodingResponse = await Location.reverseGeocodeAsync({
            latitude,
            longitude
          });
          
          console.log('Geocoding response:', JSON.stringify(geocodingResponse, null, 2));
          
          if (geocodingResponse && geocodingResponse.length > 0) {
            const locationData = geocodingResponse[0];
            console.log('User location data:', JSON.stringify(locationData, null, 2));
            
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

      const structuredResponse = completion.choices[0].message.content;
      console.log('Received structured cinema data');
      
      const parsedResponse = JSON.parse(structuredResponse);
      
      if (parsedResponse && parsedResponse.cinemas && Array.isArray(parsedResponse.cinemas)) {
        console.log(`Extracted ${parsedResponse.cinemas.length} cinemas in structured format`);
        
        dispatch(setStructuredCinemaData(parsedResponse));

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
  
  const formatStructuredCinemaResponse = (structuredData: any): string => {
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

  const getCinemaDataFromWebSearch = async (query: string) => {
    try {
      return await requestStructuredCinemaData(query);
    } catch (error) {
      console.error('Error getting cinema data from web search:', error);
      return '';
    }
  };

  const performWebSearch = async (userQuery: string): Promise<string> => {
    try {
      console.log('Performing web search for query:', userQuery);

      const isCinemaQuery = userQuery.toLowerCase().includes('cinema') || 
                            userQuery.toLowerCase().includes('theater') || 
                            userQuery.toLowerCase().includes('theatre') ||
                            userQuery.toLowerCase().includes('nearby movie') ||
                            userQuery.toLowerCase().includes('local cinema');
      
      const isMovieOnlyQuery = 
        (userQuery.toLowerCase().includes('movie') || 
          userQuery.toLowerCase().includes('film') ||
          userQuery.toLowerCase().includes('playing') || 
          userQuery.toLowerCase().includes('showing') ||
          userQuery.toLowerCase().includes('watch')) &&
        !isCinemaQuery;
      
      if (isCinemaQuery) {
        console.log('Using structured output for cinema query');
        return await requestStructuredCinemaData(userQuery);
      }
      
      let enhancedQuery = userQuery;
      
      if (isMovieOnlyQuery) {
        enhancedQuery = `${userQuery} (include accurate movie release years in parentheses, focus ONLY on current movies, provide factual information about real movies, no specific cinema information, be concise and direct)`;
        console.log('Enhanced movie-only query:', enhancedQuery);
      } else if (userQuery.toLowerCase().includes('movie') || 
          userQuery.toLowerCase().includes('film') ||
          userQuery.toLowerCase().includes('playing') ||
          userQuery.toLowerCase().includes('watch')) {
        enhancedQuery = `${userQuery} (include accurate movie release years in parentheses, be concise and direct)`;
      }
      
      console.log('Performing web search for query:', enhancedQuery);
      
      let userLocationConfig = {
        type: "approximate" as const,
        country: "US",
        city: "United States", 
        region: "United States" 
      };
      
      if (!isMovieOnlyQuery) {
        if (userLocation && userLocation.coords) {
          try {
            const { latitude, longitude } = userLocation.coords;
            console.log('User coordinates:', latitude, longitude);
          
            const geocodingResponse = await Location.reverseGeocodeAsync({
              latitude,
              longitude
            });
            
            console.log('Geocoding response:', JSON.stringify(geocodingResponse, null, 2));
            
            if (geocodingResponse && geocodingResponse.length > 0) {
              const locationData = geocodingResponse[0];
              console.log('User location data:', JSON.stringify(locationData, null, 2));
              
              
              let countryCode = "US"; // Default to US
              
             
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
          city: "United States", // Generic city for country-level search
          region: "United States" // Generic region for country-level search
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
      
      // For movie-only queries, process the response to focus on movies only
      let searchResponse = extractTextFromResponse(response);
      
      if (isMovieOnlyQuery && searchResponse) {
        console.log('Processing movie-only response to remove cinema details');
        searchResponse = await formatMovieOnlyResponse(searchResponse);
      }
      
      return searchResponse;
    } catch (error) {
      console.error('Error performing web search:', error);
      return null;
    }
  };

  // Helper function to extract text from web search response
  const extractTextFromResponse = (response: any): string => {
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

  // New function to format movie-only responses to remove cinema details
  const formatMovieOnlyResponse = async (responseText: string): Promise<string> => {
    try {
      console.log('Processing movie-only response to remove cinema details');
      
      // First extract movie details from the raw response
      const movieInfoList = extractMovieTitlesFromSearchResponse(responseText);
      
      // If we couldn't extract any movie info, return the original text
      if (movieInfoList.length === 0) {
        console.log('No movie information found in the response, returning original');
        return responseText;
      }
      
      // Create a structured response with a clear header and consistent formatting
      let formattedResponse = "Currently Playing Movies:\n\n";
      
      // Add each movie in a consistent bullet-point format with year in parentheses
      movieInfoList.forEach(movie => {
        // Extract description if available in the original text
        let description = "";
        const moviePattern = new RegExp(`${escapeRegExp(movie.title)}.*?\\(${movie.year || '\\d{4}'}\\).*?([^•\\n]+)`, 'i');
        const descMatch = responseText.match(moviePattern);
        
        if (descMatch && descMatch[1]) {
          // Clean up the description
          description = descMatch[1].replace(/^[-:\s]+/, '').trim();
          
          // If description is too long, truncate it
          if (description.length > 120) {
            description = description.substring(0, 117) + '...';
          }
          
          // Ensure the description starts with a dash if it doesn't already
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
   * Process movie titles and navigate to the MovieGallery screen
   * Merges functionality from multiple navigation methods
   * @param movieData Can be MovieInfo objects with title/year or simple strings
   */
  const processMoviesAndNavigate = async (movieData: (MovieInfo | string)[]) => {
    try {
      const movieYears: string[] = [];
      const cleanedTitles: string[] = [];
      
      console.log(`Processing ${movieData.length} movies for navigation`);
      
      movieData.forEach(item => {
        try {
          // Handle MovieInfo objects
          if (typeof item !== 'string' && 'title' in item) {
            const movieInfo = item as MovieInfo;
            console.log('Processing movie info object:', movieInfo);
            
            const title = movieInfo.title.trim();
            const year = movieInfo.year || null;
            
            console.log(`Using pre-extracted title "${title}" with year: ${year || 'none'}`);
            movieYears.push(year);
            cleanedTitles.push(title);
          }
          // Handle string titles
          else {
            // Safely convert to string (in case it's an object with toString)
            const titleString = String(item);
            console.log('Processing title string:', titleString);
            
            // Create a new string instead of modifying the original
            let cleanTitle = titleString
              .replace(/^\d+\.\s*/, '')          
              .replace(/^\s*\*+\s*/, '')         
              .replace(/\*+/g, '')               
              .replace(/"/g, '')                 
          .trim();
        
        console.log('Cleaned title:', cleanTitle);
        
            // Check for year in parentheses: Movie Title (2023)
            const yearMatch = cleanTitle.match(/\s*\((\d{4})\)$/);
            let year = null;
            
        if (yearMatch) {
              year = yearMatch[1];
          cleanTitle = cleanTitle.replace(/\s*\(\d{4}\)$/, '').trim();
              console.log(`Extracted year: ${year}, Final title: "${cleanTitle}"`);
            } else {
              // Also check for dash-year format: Movie Title - 2023
              const dashYearMatch = cleanTitle.match(/([^:\-–—]+)[\-–—]\s*(\d{4})\b/);
              if (dashYearMatch && dashYearMatch[1] && dashYearMatch[2]) {
                year = dashYearMatch[2];
                cleanTitle = dashYearMatch[1].trim();
                console.log(`Extracted year from dash format: ${year}, Final title: "${cleanTitle}"`);
        } else {
          console.log('No year found in title');
              }
            }
            
            movieYears.push(year);
          cleanedTitles.push(cleanTitle);
          }
        } catch (error) {
          console.error('Error processing movie item:', error);
          // Add a fallback
          if (typeof item === 'string') {
            movieYears.push(null);
            cleanedTitles.push(item.trim());
          } else if (typeof item === 'object' && item !== null && 'title' in item) {
            const movieInfo = item as any;
            movieYears.push(movieInfo.year || null);
            cleanedTitles.push(movieInfo.title || 'Unknown Movie');
          }
        }
      });
      
      console.log('Final extracted titles:', cleanedTitles);
      console.log('Final extracted years:', movieYears);
      
      // Clear previous search results first
      dispatch(clearSearchResults());
      
      // Construct search queries combining title and year where available
      const searchQueries = cleanedTitles.map((title, index) => {
        const year = movieYears[index];
        if (year) {
          // Include the year in the query to use TMDB's primary_release_year parameter
          const searchQueryWithYear = `${title} ${year}`;
          console.log(`Search query with year: "${searchQueryWithYear}"`);
          return searchQueryWithYear;
        }
        console.log(`Search query without year: "${title}"`);
        return title;
      });
      
      console.log('Search queries with years (will be passed to TMDB API):', searchQueries);
      
      // Dispatch search actions for all movies
      await Promise.all(
        searchQueries.map(query => {
          try {
            return dispatch(searchMovies(query)).unwrap();
          } catch (error) {
            console.error('Error searching for movie:', error);
            return Promise.resolve();
          }
        })
      );
      
      // Navigate to the MovieGallery with titles and years
      navigation.navigate('MovieGallery', { 
        movieTitles: cleanedTitles,
        movieYears: movieYears,
        requireExactMatch: true,
        fromAI: true
      });
      
    } catch (error) {
      console.error('Error processing movie data:', error);
      // Navigate anyway with the data we have, but safely
      let fallbackTitles = [];
      let fallbackYears = [];
      
      try {
        if (typeof movieData[0] !== 'string' && 'title' in movieData[0]) {
          const movieInfo = movieData as MovieInfo[];
          fallbackTitles = movieInfo.map(info => info.title || 'Unknown Movie');
          fallbackYears = movieInfo.map(info => info.year || null);
        } else {
          fallbackTitles = movieData.map(item => typeof item === 'string' ? item : 'Unknown Movie');
          fallbackYears = movieData.map(() => null);
        }
      } catch (err) {
        console.error('Error creating fallback data:', err);
        fallbackTitles = ['Movie search results'];
      }
      
      navigation.navigate('MovieGallery', { 
        movieTitles: fallbackTitles,
        movieYears: fallbackYears,
        requireExactMatch: false,
        fromAI: true 
      });
    }
  };

  // Submit handler for user message
  const handleSubmit = async (userQueryOrEvent?: string | React.FormEvent) => {
    let userQuery: string;
    
    // Handle different ways this function can be called
    if (typeof userQueryOrEvent === 'string') {
      // Called with a string parameter (the query)
      userQuery = userQueryOrEvent.trim();
    } else if (userQueryOrEvent && 'preventDefault' in userQueryOrEvent) {
      // Called with a form event
      userQueryOrEvent.preventDefault();
      userQuery = (pendingInput || input).trim();
    } else {
      // Called with no parameters
      userQuery = (pendingInput || input).trim();
    }

    // Don't process empty queries
    if (!userQuery) {
      console.log('Empty query, not submitting');
      return;
    }

    try {
      // Set loading state
      setIsLoading(true);
      setError(null);
      
      // Dismiss keyboard
      Keyboard.dismiss();
      setIsExpanded(true);

      // Add user message to history
      const userMessage: ChatMessage = { role: 'user', content: userQuery };
      dispatch(addMessageToHistory(userMessage));

      // Determine user intent
      const { screenType, useWebSearch } = await determineUserIntent(userQuery);
      console.log(`User intent determined: screenType=${screenType}, useWebSearch=${useWebSearch}`);
      
      // Check if this is a showtime-related query
      if (screenType === SCREEN_TYPES.MOVIE_SHOWTIMES) {
        console.log('Showtime-related query detected, checking if generic or specific');
        
        // Check if this is a generic showtime query that needs a movie title
        if (isGenericShowtimeQuery(userQuery)) {
          console.log('Generic showtime query detected, will ask for movie title');
          
          const genericResponse = "I can help you find showtimes. Which movie would you like to see?";
          dispatch(setResponse(genericResponse));
          
          // Add AI response to history
          const assistantMessage: ChatMessage = { role: 'assistant', content: genericResponse };
          dispatch(addMessageToHistory(assistantMessage));
          
          setIsLoading(false);
          if (userQuery === input) {
            setInput('');
          }
          setPendingInput('');
          return;
        } else {
          console.log('Specific movie showtime query detected, will extract movie title');
          
          // Extract the movie title using our local function
          const movieTitle = extractMovieTitle(userQuery);
          
          if (movieTitle) {
            console.log('Extracted movie title:', movieTitle);
            
            // Get today's date in ISO format for the showtime search
            const today = new Date().toISOString().split('T')[0];
            
            // Search for the movie to ensure data is available
            await dispatch(searchMovies(movieTitle));
            
            // Navigate to the showtime screen with the movie title and date
            navigation.navigate('MovieShowtime', { 
              movieTitle: movieTitle,
              date: today,
              fromAI: true
            });
            
            // Let the user know we're getting showtimes
            const showtimeResponse = `Getting showtimes for "${movieTitle}"...`;
            dispatch(setResponse(showtimeResponse));
            
            // Add AI response to history
            const assistantMessage: ChatMessage = { role: 'assistant', content: showtimeResponse };
            dispatch(addMessageToHistory(assistantMessage));
            
            setIsLoading(false);
            if (userQuery === input) {
              setInput('');
            }
            setPendingInput('');
            return;
          } else {
            console.log('No movie title found in query');
            const noMovieResponse = "I couldn't determine which movie you're asking about. Can you please specify the movie title?";
            dispatch(setResponse(noMovieResponse));
            
            // Add AI response to history
            const assistantMessage: ChatMessage = { role: 'assistant', content: noMovieResponse };
            dispatch(addMessageToHistory(assistantMessage));
            
            setIsLoading(false);
            if (userQuery === input) {
              setInput('');
            }
            setPendingInput('');
            return;
          }
        }
      }
      
      // If a specific screen was determined
      if (screenType) {
        handleScreenNavigation(screenType, userQuery);
      } 
      // No specific screen was determined, use web search or conversation
      else {
        handleGeneralQuery(userQuery, useWebSearch);
      }
      
      setIsLoading(false);
      if (userQuery === input) {
        setInput('');
      }
      setPendingInput('');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError('Sorry, there was an error processing your request.');
      dispatch(setResponse('Sorry, there was an error processing your request. Please try again.'));
      
      // Add error response to history
      const assistantMessage: ChatMessage = { role: 'assistant', content: 'Sorry, there was an error processing your request. Please try again.' };
      dispatch(addMessageToHistory(assistantMessage));
      
      setIsLoading(false);
      if (userQuery === input) {
        setInput('');
      }
      setPendingInput('');
    }
  };

  // Updated function to handle general queries
  const handleGeneralQuery = async (userQuery: string, useWebSearch: boolean = false) => {
    console.log('Handling as general query:', userQuery);
    
    // For general queries, use web search if appropriate
    if (useWebSearch) {
      console.log('Using web search for general query');
      const searchResponse = await performWebSearch(userQuery);
      
      if (searchResponse) {
        console.log('Got web search response for general query');
        
        // Extract movie titles from the response
        const movieInfoList = extractMovieTitlesFromSearchResponse(searchResponse);
        console.log(`Extracted ${movieInfoList.length} movie titles from response`);
        
        // Extract other entities (cinemas, etc.)
        const entityData = await extractEntitiesFromResponse(searchResponse);
        console.log('Extracted entity data:', {
          movieTitlesCount: entityData.movieTitles?.length || 0,
          cinemaNamesCount: entityData.cinemaNames?.length || 0,
          hasMultipleMovies: entityData.hasMultipleMovies,
          hasMultipleCinemas: entityData.hasMultipleCinemas
        });
        
        // Set the response
        const enhancedResponse = movieInfoList.length > 0 
          ? enhanceResponseWithYears(searchResponse, movieInfoList) 
          : searchResponse;
        
        dispatch(setResponse(enhancedResponse));
        
        // Add AI response to history
        const assistantMessage: ChatMessage = { role: 'assistant', content: enhancedResponse };
        dispatch(addMessageToHistory(assistantMessage));
        
        // Determine where to navigate based on the content
        
        // Multiple movies detected - navigate to movie gallery
        if (movieInfoList.length > 1 || (entityData.movieTitles && entityData.movieTitles.length > 1)) {
          console.log('Multiple movies detected, navigating to MovieGallery');
          if (movieInfoList.length > 1) {
            await processMoviesAndNavigate(movieInfoList);
          } else if (entityData.movieTitles && entityData.movieTitles.length > 1) {
            await processMoviesAndNavigate(entityData.movieTitles);
          }
        }
        // Single movie detected - navigate to movie details
        else if (movieInfoList.length === 1 || (entityData.movieTitles && entityData.movieTitles.length === 1)) {
          console.log('Single movie detected');
          const movieTitle = movieInfoList.length === 1 
            ? movieInfoList[0].title 
            : entityData.primaryMovie || entityData.movieTitles[0];
          
          if (movieTitle) {
            console.log('Navigating to MovieDetails for:', movieTitle);
            await dispatch(searchMovies(movieTitle));
            navigation.navigate('MovieDetails', { movieTitle, fromAI: true });
          }
        }
        // Multiple cinemas detected - navigate to cinema gallery
        else if (entityData.cinemaNames && entityData.cinemaNames.length > 0) {
          console.log('Cinema(s) detected, navigating to CinemaGallery');
          navigation.navigate('CinemaGallery', { fromAI: true });
        }
      } else {
        // No web search response, use OpenAI conversation
        const openAIResponse = await getOpenAIResponse(userQuery);
        if (openAIResponse) {
          dispatch(setResponse(openAIResponse));
          
          // Add AI response to history
          const assistantMessage: ChatMessage = { role: 'assistant', content: openAIResponse };
          dispatch(addMessageToHistory(assistantMessage));
          
          // Try to extract entities from the OpenAI response too
          const entityData = await extractEntitiesFromResponse(openAIResponse);
          if (entityData.movieTitles && entityData.movieTitles.length > 1) {
            console.log('Multiple movies detected in OpenAI response, navigating to MovieGallery');
            await processMoviesAndNavigate(entityData.movieTitles);
          } else if (entityData.movieTitles && entityData.movieTitles.length === 1) {
            console.log('Single movie detected in OpenAI response');
            const movieTitle = entityData.primaryMovie || entityData.movieTitles[0];
            console.log('Navigating to MovieDetails for:', movieTitle);
            await dispatch(searchMovies(movieTitle));
            navigation.navigate('MovieDetails', { movieTitle, fromAI: true });
          } else if (entityData.cinemaNames && entityData.cinemaNames.length > 0) {
            console.log('Cinema(s) detected in OpenAI response, navigating to CinemaGallery');
            navigation.navigate('CinemaGallery', { fromAI: true });
          }
        } else {
          console.log('No web search or OpenAI response for general query');
          dispatch(setResponse('I couldn\'t find information related to your query. Could you please try asking differently?'));
          
          // Add AI response to history
          const assistantMessage: ChatMessage = { role: 'assistant', content: 'I couldn\'t find information related to your query. Could you please try asking differently?' };
          dispatch(addMessageToHistory(assistantMessage));
        }
      }
    } else {
      // For general conversational queries, use OpenAI
      const openAIResponse = await getOpenAIResponse(userQuery);
      if (openAIResponse) {
        dispatch(setResponse(openAIResponse));
        
        // Add AI response to history
        const assistantMessage: ChatMessage = { role: 'assistant', content: openAIResponse };
        dispatch(addMessageToHistory(assistantMessage));
        
        // Try to navigate based on the OpenAI response
        const entityData = await extractEntitiesFromResponse(openAIResponse);
        const movieInfoList = extractMovieTitlesFromSearchResponse(openAIResponse);
        
        if (movieInfoList.length > 1 || (entityData.movieTitles && entityData.movieTitles.length > 1)) {
          console.log('Multiple movies detected in OpenAI conversation, navigating to MovieGallery');
          if (movieInfoList.length > 1) {
            await processMoviesAndNavigate(movieInfoList);
          } else if (entityData.movieTitles && entityData.movieTitles.length > 1) {
            await processMoviesAndNavigate(entityData.movieTitles);
          }
        } else if (movieInfoList.length === 1 || (entityData.movieTitles && entityData.movieTitles.length === 1)) {
          console.log('Single movie detected in OpenAI conversation');
          const movieTitle = movieInfoList.length === 1 
            ? movieInfoList[0].title 
            : entityData.primaryMovie || entityData.movieTitles[0];
          
          if (movieTitle) {
            console.log('Navigating to MovieDetails for:', movieTitle);
            await dispatch(searchMovies(movieTitle));
            navigation.navigate('MovieDetails', { movieTitle, fromAI: true });
          }
        } else if (entityData.cinemaNames && entityData.cinemaNames.length > 0) {
          console.log('Cinema(s) detected in OpenAI conversation, navigating to CinemaGallery');
          navigation.navigate('CinemaGallery', { fromAI: true });
        }
      } else {
        console.log('No response from OpenAI for conversational query');
        dispatch(setResponse('I can help you find movies, showtimes, and cinemas near you. Try asking about specific movies, nearby cinemas, or showtimes.'));
        
        // Add AI response to history
        const assistantMessage: ChatMessage = { role: 'assistant', content: 'I can help you find movies, showtimes, and cinemas near you. Try asking about specific movies, nearby cinemas, or showtimes.' };
        dispatch(addMessageToHistory(assistantMessage));
      }
    }
  };

  // Helper function to enhance AI response with year information
  const enhanceResponseWithYears = (response: string, movieInfoList: MovieInfo[]): string => {
    let enhancedResponse = response;
    
    movieInfoList.forEach(movieInfo => {
      if (movieInfo.title && movieInfo.year) {
        // Only enhance titles that don't already have a year
        const escapedTitle = escapeRegExp(movieInfo.title);
        const pattern = new RegExp(`\\b${escapedTitle}\\b(?!\\s*\\(\\d{4}\\))`, 'g');
        enhancedResponse = enhancedResponse.replace(pattern, `${movieInfo.title} (${movieInfo.year})`);
      }
    });
    
    return enhancedResponse;
  };

  // Helper function to escape special regex characters in a string
  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Function to get a response from OpenAI
  const getOpenAIResponse = async (query: string): Promise<string> => {
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

  // Function to handle navigation based on screen type
  const handleScreenNavigation = async (screenType: string, userQuery: string) => {
    switch (screenType) {
      case SCREEN_TYPES.MOVIE_GALLERY:
        console.log('Processing movie gallery query');
        
        // For movie gallery queries, search for current movies
        const movieResponse = await performWebSearch(userQuery);
        
        if (movieResponse) {
          console.log('Got web search response for movies');
          const movieInfoList = extractMovieTitlesFromSearchResponse(movieResponse);
          
          if (movieInfoList.length > 0) {
            console.log(`Found ${movieInfoList.length} movies in response`);
            
            // Set the response to show the movie list
            const enhancedResponse = enhanceResponseWithYears(movieResponse, movieInfoList);
            dispatch(setResponse(enhancedResponse));
          
          // Add AI response to history
            const assistantMessage: ChatMessage = { role: 'assistant', content: enhancedResponse };
          dispatch(addMessageToHistory(assistantMessage));
          
            // Process and navigate to the movie gallery
            await processMoviesAndNavigate(movieInfoList);
          } else {
            console.log('No movies found in the response');
            dispatch(setResponse(movieResponse));
        
            // Add AI response to history
            const assistantMessage: ChatMessage = { role: 'assistant', content: movieResponse };
            dispatch(addMessageToHistory(assistantMessage));
          }
        } else {
          console.log('No web search response for movies');
          dispatch(setResponse('I couldn\'t find information about current movies. Please try again later.'));
          
          // Add AI response to history
          const assistantMessage: ChatMessage = { role: 'assistant', content: 'I couldn\'t find information about current movies. Please try again later.' };
          dispatch(addMessageToHistory(assistantMessage));
        }
        break;
        
      case SCREEN_TYPES.CINEMA_GALLERY:
        console.log('Processing cinema gallery query');
        
        // For cinema gallery queries, get cinema data
        const cinemaResponse = await getCinemaDataFromWebSearch(userQuery);
        
        if (cinemaResponse) {
          console.log('Got response for cinemas');
          
          // Set the response to show the cinemas
          dispatch(setResponse(cinemaResponse));
          
          // Add AI response to history
          const assistantMessage: ChatMessage = { role: 'assistant', content: cinemaResponse };
          dispatch(addMessageToHistory(assistantMessage));
          
          // Navigate to the cinema gallery
          navigation.navigate('CinemaGallery', { fromAI: true });
        } else {
          console.log('No response for cinemas');
          dispatch(setResponse('I couldn\'t find information about cinemas near you. Please try again later.'));
          
          // Add AI response to history
          const assistantMessage: ChatMessage = { role: 'assistant', content: 'I couldn\'t find information about cinemas near you. Please try again later.' };
          dispatch(addMessageToHistory(assistantMessage));
        }
        break;

      case SCREEN_TYPES.MOVIE_DETAILS:
        console.log('Processing movie details query');
        
        // Get AI response that will include [MOVIE] tags
        const detailsResponse = await getOpenAIResponse(userQuery);
        
        // Extract movie entities from the response
        const movieEntityData = await extractEntitiesFromResponse(detailsResponse || userQuery);
        
        if (movieEntityData.movieTitles && movieEntityData.movieTitles.length > 0) {
          // Use the primary movie or the first movie in the list
          const movieTitle = movieEntityData.primaryMovie || movieEntityData.movieTitles[0].replace(/\s*\(\d{4}\)$/, '');
          console.log('Extracted movie title:', movieTitle);
          
          // Search for the movie
          await dispatch(searchMovies(movieTitle));
          
          // Set the response to indicate we're getting movie details
          const aiResponse = `Getting details for "${movieTitle}"...`;
        dispatch(setResponse(aiResponse));
          
          // Add AI response to history
          const assistantMessage: ChatMessage = { role: 'assistant', content: aiResponse };
          dispatch(addMessageToHistory(assistantMessage));
          
          // Navigate to the movie details screen
          navigation.navigate('MovieDetails', { movieTitle, fromAI: true });
      } else {
          console.log('No movie title found in entity extraction');
          const aiResponse = 'I couldn\'t identify which movie you\'re asking about. Could you please specify the movie title?';
        dispatch(setResponse(aiResponse));
        
        // Add AI response to history
        const assistantMessage: ChatMessage = { role: 'assistant', content: aiResponse };
        dispatch(addMessageToHistory(assistantMessage));
        }
        break;

      case SCREEN_TYPES.CINEMA_DETAILS:
        console.log('Processing cinema details query');
        
        // For cinema details, extract the cinema name
        const cinemaName = await extractCinemaName(userQuery);
        
        if (cinemaName) {
          console.log('Extracted cinema name:', cinemaName);
          
          // Set the response to indicate we're getting cinema details
          const aiResponse = `Getting details for "${cinemaName}"...`;
          dispatch(setResponse(aiResponse));
          
          // Add AI response to history
          const assistantMessage: ChatMessage = { role: 'assistant', content: aiResponse };
          dispatch(addMessageToHistory(assistantMessage));
          
          // Navigate to the cinema details screen
          navigation.navigate('CinemaDetails', { cinemaName, fromAI: true });
          } else {
          console.log('No cinema name found in query');
          const aiResponse = 'I couldn\'t identify which cinema you\'re asking about. Could you please specify the cinema name?';
          dispatch(setResponse(aiResponse));
          
          // Add AI response to history
          const assistantMessage: ChatMessage = { role: 'assistant', content: aiResponse };
          dispatch(addMessageToHistory(assistantMessage));
          }
          break;

      case SCREEN_TYPES.START_SCREEN:
        console.log('Navigating to start screen');
        
        // For start screen, just navigate there
        navigation.navigate('StartScreen');
        
        // Set a response
        dispatch(setResponse('Here\'s the start screen. How can I help you?'));
        
        // Add AI response to history
        const assistantMessage: ChatMessage = { role: 'assistant', content: 'Here\'s the start screen. How can I help you?' };
        dispatch(addMessageToHistory(assistantMessage));
            break;

        default:
        // Handle any other screen types or unknown screens as a general query
        handleGeneralQuery(userQuery, false);
          break;
    }
  };

  // Update toggleExpanded function to save state
  const toggleExpanded = async (event?: any) => {
    // If event exists (from touch), prevent it from bubbling up
    if (event) {
      event.stopPropagation && event.stopPropagation();
    }
    
    const newState = !isExpanded;
    setIsExpanded(newState);
    
    // Save state to AsyncStorage
    try {
      await AsyncStorage.setItem(EXPANDED_STATE_KEY, newState.toString());
      console.log('Saved AI chatbox expanded state:', newState);
    } catch (error) {
      console.error('Error saving AI chatbox expanded state:', error);
    }
  };

  // Update the Redux store with the chatbox height whenever it changes
  const measureChatboxHeight = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    dispatch(setChatboxHeight(height));
  };

  // Form submission handler
  const onFormSubmit = () => {
    if (!input.trim()) return;
    handleSubmit(input);
    setInput('');
  };

  if (!isVisible) return null;
  const chatBottomPosition = isKeyboardVisible ? keyboardHeight : 0;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: chatBottomPosition,
        zIndex: 1000,
      }}
      onLayout={measureChatboxHeight}
    >
      {response && (
        <View style={styles.chatBoxContainer}>
          {Platform.OS === 'ios' ? (
            <BlurView 
              intensity={50} 
              tint="light"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderTopLeftRadius: RADIUS.medium,
                borderTopRightRadius: RADIUS.medium,
              }}
            />
          ) : null}
          
          <View
            style={[
            styles.responseContainer, 
              isExpanded ? styles.expandedResponseContainer : styles.truncatedResponseContainer,
          ]}
          >
            <View style={styles.responseContentContainer}>
            <ScrollView 
                style={[
                  styles.responseTextContainer,
                  isExpanded && styles.expandedResponseTextContainer
                ]}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                contentContainerStyle={{ paddingRight: 8 }}
              >
                <Text style={styles.responseText}>
                  {response}
                </Text>
            </ScrollView>
              <View style={styles.textToSpeechContainer}>
                <TextToSpeech text={response} size={22} color={COLORS.amazonBlue} />
              </View>
            </View>
          </View>
            
                <TouchableOpacity 
            style={styles.expandCollapseButton}
                  onPress={toggleExpanded}
                  activeOpacity={0.7}
                >
            <Text style={styles.expandCollapseButtonText}>
              {isExpanded ? "Show Less" : "Show More"}
                  </Text>
                <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={COLORS.amazonBlue} 
              style={styles.expandCollapseIcon}
                />
              </TouchableOpacity>
          
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={isLoading ? pendingInput : input}
                onChangeText={setInput}
                placeholder="Ask me anything..."
                placeholderTextColor={COLORS.silverGray}
                mode="flat"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                selectionColor={COLORS.iosBlue}
                theme={isLoading ? loadingInputTheme : inputTheme}
                disabled={isLoading}
                multiline={true}
                numberOfLines={3}
              />
              {!isLoading && (
                <VoiceInput
                  onInputChange={setInput}
                  onSubmit={onFormSubmit}
                  isTyping={input.trim() !== ''}
                  userInputText={input}
                />
              )}
              {isLoading && (
                <View style={styles.iconButton}>
                  <ActivityIndicator size="small" color={COLORS.iosBlue} />
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default AIChatBox;
