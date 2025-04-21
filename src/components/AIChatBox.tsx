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
import { 
  formatStructuredCinemaResponse, 
  extractTextFromResponse, 
  requestStructuredCinemaData, 
  determineScreenType, 
  getOpenAIResponse, 
  performWebSearch, 
  formatMovieOnlyResponse 
} from './AIChat/OpenAIService';
import { 
  extractMovieTitle, 
  extractCinemaName, 
  extractMovieTitlesFromResponse, 
  extractEntitiesFromResponse, 
  escapeRegExp, 
  enhanceResponseWithYears 
} from './AIChat/extractors';
import {
  isGenericShowtimeQuery,
  determineUserIntent
} from './AIChat/QueryClassifier';

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
          if (typeof item !== 'string' && 'title' in item) {
            const movieInfo = item as MovieInfo;
            console.log('Processing movie info object:', movieInfo);
            
            const title = movieInfo.title.trim();
            const year = movieInfo.year || null;
            
            console.log(`Using pre-extracted title "${title}" with year: ${year || 'none'}`);
            movieYears.push(year);
            cleanedTitles.push(title);
          }
          else {
            const titleString = String(item);
            console.log('Processing title string:', titleString);
            
            let cleanTitle = titleString
              .replace(/^\d+\.\s*/, '')          
              .replace(/^\s*\*+\s*/, '')         
              .replace(/\*+/g, '')               
              .replace(/"/g, '')                 
          .trim();
        
        console.log('Cleaned title:', cleanTitle);
        
            const yearMatch = cleanTitle.match(/\s*\((\d{4})\)$/);
            let year = null;
            
        if (yearMatch) {
              year = yearMatch[1];
          cleanTitle = cleanTitle.replace(/\s*\(\d{4}\)$/, '').trim();
              console.log(`Extracted year: ${year}, Final title: "${cleanTitle}"`);
            } else {
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
      
      dispatch(clearSearchResults());
      
      const searchQueries = cleanedTitles.map((title, index) => {
        const year = movieYears[index];
        if (year) {
          const searchQueryWithYear = `${title} ${year}`;
          console.log(`Search query with year: "${searchQueryWithYear}"`);
          return searchQueryWithYear;
        }
        console.log(`Search query without year: "${title}"`);
        return title;
      });
      
      console.log('Search queries with years (will be passed to TMDB API):', searchQueries);
      
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
      
      navigation.navigate('MovieGallery', { 
        movieTitles: cleanedTitles,
        movieYears: movieYears,
        requireExactMatch: true,
        fromAI: true
      });
      
    } catch (error) {
      console.error('Error processing movie data:', error);
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

  const handleSubmit = async (userQueryOrEvent?: string | React.FormEvent) => {
    let userQuery: string;
    
    if (typeof userQueryOrEvent === 'string') {
      userQuery = userQueryOrEvent.trim();
    } else if (userQueryOrEvent && 'preventDefault' in userQueryOrEvent) {
      userQueryOrEvent.preventDefault();
      userQuery = (pendingInput || input).trim();
    } else {
      userQuery = (pendingInput || input).trim();
    }

    if (!userQuery) {
      console.log('Empty query, not submitting');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      Keyboard.dismiss();
      setIsExpanded(true);

      const userMessage: ChatMessage = { role: 'user', content: userQuery };
      dispatch(addMessageToHistory(userMessage));

      const { screenType, useWebSearch } = await determineUserIntent(userQuery);
      console.log(`User intent determined: screenType=${screenType}, useWebSearch=${useWebSearch}`);
      
      if (screenType === SCREEN_TYPES.MOVIE_SHOWTIMES) {
        console.log('Showtime-related query detected, checking if generic or specific');
        
        if (isGenericShowtimeQuery(userQuery)) {
          console.log('Generic showtime query detected, will ask for movie title');
          
          const genericResponse = "I can help you find showtimes. Which movie would you like to see?";
          dispatch(setResponse(genericResponse));
          
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
          
          const movieTitle = extractMovieTitle(userQuery);
          
          if (movieTitle) {
            console.log('Extracted movie title:', movieTitle);
            
            const today = new Date().toISOString().split('T')[0];
            
            await dispatch(searchMovies(movieTitle));
            
            navigation.navigate('MovieShowtime', { 
              movieTitle: movieTitle,
              date: today,
              fromAI: true
            });
            
            const showtimeResponse = `Getting showtimes for "${movieTitle}"...`;
            dispatch(setResponse(showtimeResponse));
            
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
      
      if (screenType) {
        handleScreenNavigation(screenType, userQuery);
      } 
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
      
      const assistantMessage: ChatMessage = { role: 'assistant', content: 'Sorry, there was an error processing your request. Please try again.' };
      dispatch(addMessageToHistory(assistantMessage));
      
      setIsLoading(false);
      if (userQuery === input) {
        setInput('');
      }
      setPendingInput('');
    }
  };

  const handleGeneralQuery = async (userQuery: string, useWebSearch: boolean = false) => {
    console.log('Handling as general query:', userQuery);
    
    if (useWebSearch) {
      console.log('Using web search for general query');
      const searchResponse = await performWebSearch(userQuery, userLocation);
      
      if (searchResponse) {
        console.log('Got web search response for general query');
        
        const movieInfoList = extractMovieTitlesFromResponse(searchResponse);
        console.log(`Extracted ${movieInfoList.length} movie titles from response`);
        
        const entityData = await extractEntitiesFromResponse(searchResponse);
        console.log('Extracted entity data:', {
          movieTitlesCount: entityData.movieTitles?.length || 0,
          cinemaNamesCount: entityData.cinemaNames?.length || 0,
          hasMultipleMovies: entityData.hasMultipleMovies,
          hasMultipleCinemas: entityData.hasMultipleCinemas
        });
        
        const enhancedResponse = movieInfoList.length > 0 
          ? enhanceResponseWithYears(searchResponse, movieInfoList) 
          : searchResponse;
        
        dispatch(setResponse(enhancedResponse));
        
        const assistantMessage: ChatMessage = { role: 'assistant', content: enhancedResponse };
        dispatch(addMessageToHistory(assistantMessage));
        
        if (movieInfoList.length > 1 || (entityData.movieTitles && entityData.movieTitles.length > 1)) {
          console.log('Multiple movies detected, navigating to MovieGallery');
          if (movieInfoList.length > 1) {
            await processMoviesAndNavigate(movieInfoList);
          } else if (entityData.movieTitles && entityData.movieTitles.length > 1) {
            await processMoviesAndNavigate(entityData.movieTitles);
          }
        }
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
        else if (entityData.cinemaNames && entityData.cinemaNames.length > 0) {
          console.log('Cinema(s) detected, navigating to CinemaGallery');
          navigation.navigate('CinemaGallery', { fromAI: true });
        }
      } else {
        const openAIResponse = await getOpenAIResponse(userQuery, conversationHistory.slice(-6));
        if (openAIResponse) {
          dispatch(setResponse(openAIResponse));
          
          const assistantMessage: ChatMessage = { role: 'assistant', content: openAIResponse };
          dispatch(addMessageToHistory(assistantMessage));
          
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
          
          const assistantMessage: ChatMessage = { role: 'assistant', content: 'I couldn\'t find information related to your query. Could you please try asking differently?' };
          dispatch(addMessageToHistory(assistantMessage));
        }
      }
    } else {
      const openAIResponse = await getOpenAIResponse(userQuery, conversationHistory.slice(-6));
      if (openAIResponse) {
        dispatch(setResponse(openAIResponse));
        
        const assistantMessage: ChatMessage = { role: 'assistant', content: openAIResponse };
        dispatch(addMessageToHistory(assistantMessage));
        
        const entityData = await extractEntitiesFromResponse(openAIResponse);
        const movieInfoList = extractMovieTitlesFromResponse(openAIResponse);
        
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
        
        const assistantMessage: ChatMessage = { role: 'assistant', content: 'I can help you find movies, showtimes, and cinemas near you. Try asking about specific movies, nearby cinemas, or showtimes.' };
        dispatch(addMessageToHistory(assistantMessage));
      }
    }
  };

  const handleScreenNavigation = async (screenType: string, userQuery: string) => {
    switch (screenType) {
      case SCREEN_TYPES.MOVIE_GALLERY:
        console.log('Processing movie gallery query');
        
        const movieResponse = await performWebSearch(userQuery, userLocation);
        
        if (movieResponse) {
          console.log('Got web search response for movies');
          const movieInfoList = extractMovieTitlesFromResponse(movieResponse);
          
          if (movieInfoList.length > 0) {
            console.log(`Found ${movieInfoList.length} movies in response`);
            
            const enhancedResponse = enhanceResponseWithYears(movieResponse, movieInfoList);
            dispatch(setResponse(enhancedResponse));
          
            const assistantMessage: ChatMessage = { role: 'assistant', content: enhancedResponse };
          dispatch(addMessageToHistory(assistantMessage));
          
            await processMoviesAndNavigate(movieInfoList);
          } else {
            console.log('No movies found in the response');
            dispatch(setResponse(movieResponse));
        
            const assistantMessage: ChatMessage = { role: 'assistant', content: movieResponse };
            dispatch(addMessageToHistory(assistantMessage));
          }
        } else {
          console.log('No web search response for movies');
          dispatch(setResponse('I couldn\'t find information about current movies. Please try again later.'));
          
          const assistantMessage: ChatMessage = { role: 'assistant', content: 'I couldn\'t find information about current movies. Please try again later.' };
          dispatch(addMessageToHistory(assistantMessage));
        }
        break;
        
      case SCREEN_TYPES.CINEMA_GALLERY:
        console.log('Processing cinema gallery query');
        
        const cinemaResponse = await requestStructuredCinemaData(userQuery, userLocation);
        
        if (cinemaResponse) {
          console.log('Got response for cinemas');
          
          dispatch(setResponse(cinemaResponse));
          
          const assistantMessage: ChatMessage = { role: 'assistant', content: cinemaResponse };
          dispatch(addMessageToHistory(assistantMessage));
          
          navigation.navigate('CinemaGallery', { fromAI: true });
        } else {
          console.log('No response for cinemas');
          dispatch(setResponse('I couldn\'t find information about cinemas near you. Please try again later.'));
          
          const assistantMessage: ChatMessage = { role: 'assistant', content: 'I couldn\'t find information about cinemas near you. Please try again later.' };
          dispatch(addMessageToHistory(assistantMessage));
        }
        break;

      case SCREEN_TYPES.MOVIE_DETAILS:
        console.log('Processing movie details query');
        
        const detailsResponse = await getOpenAIResponse(userQuery, conversationHistory.slice(-6));
        
        const movieEntityData = await extractEntitiesFromResponse(detailsResponse || userQuery);
        
        if (movieEntityData.movieTitles && movieEntityData.movieTitles.length > 0) {
          const movieTitle = movieEntityData.primaryMovie || movieEntityData.movieTitles[0].replace(/\s*\(\d{4}\)$/, '');
          console.log('Extracted movie title:', movieTitle);
          
          await dispatch(searchMovies(movieTitle));
          
          const aiResponse = `Getting details for "${movieTitle}"...`;
        dispatch(setResponse(aiResponse));
          
          const assistantMessage: ChatMessage = { role: 'assistant', content: aiResponse };
          dispatch(addMessageToHistory(assistantMessage));
          
          navigation.navigate('MovieDetails', { movieTitle, fromAI: true });
      } else {
          console.log('No movie title found in entity extraction');
          const aiResponse = 'I couldn\'t identify which movie you\'re asking about. Could you please specify the movie title?';
        dispatch(setResponse(aiResponse));
        
        const assistantMessage: ChatMessage = { role: 'assistant', content: aiResponse };
        dispatch(addMessageToHistory(assistantMessage));
        }
        break;

      case SCREEN_TYPES.CINEMA_DETAILS:
        console.log('Processing cinema details query');
        
        const cinemaName = await extractCinemaName(userQuery);
        
        if (cinemaName) {
          console.log('Extracted cinema name:', cinemaName);
          
          const aiResponse = `Getting details for "${cinemaName}"...`;
          dispatch(setResponse(aiResponse));
          
          const assistantMessage: ChatMessage = { role: 'assistant', content: aiResponse };
          dispatch(addMessageToHistory(assistantMessage));
          
          navigation.navigate('CinemaDetails', { cinemaName, fromAI: true });
          } else {
          console.log('No cinema name found in query');
          const aiResponse = 'I couldn\'t identify which cinema you\'re asking about. Could you please specify the cinema name?';
          dispatch(setResponse(aiResponse));
          
          const assistantMessage: ChatMessage = { role: 'assistant', content: aiResponse };
          dispatch(addMessageToHistory(assistantMessage));
          }
          break;

      case SCREEN_TYPES.START_SCREEN:
        console.log('Navigating to start screen');
        
        navigation.navigate('StartScreen');
        
        dispatch(setResponse('Here\'s the start screen. How can I help you?'));
        
        const assistantMessage: ChatMessage = { role: 'assistant', content: 'Here\'s the start screen. How can I help you?' };
        dispatch(addMessageToHistory(assistantMessage));
            break;

        default:
        handleGeneralQuery(userQuery, false);
          break;
    }
  };

  const toggleExpanded = async (event?: any) => {
    if (event) {
      event.stopPropagation && event.stopPropagation();
    }
    
    const newState = !isExpanded;
    setIsExpanded(newState);
    
    try {
      await AsyncStorage.setItem(EXPANDED_STATE_KEY, newState.toString());
      console.log('Saved AI chatbox expanded state:', newState);
    } catch (error) {
      console.error('Error saving AI chatbox expanded state:', error);
    }
  };

  const measureChatboxHeight = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    dispatch(setChatboxHeight(height));
  };

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
