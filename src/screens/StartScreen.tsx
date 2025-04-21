import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image, ActivityIndicator, StatusBar } from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import AIChatBox from '../components/AIChatBox';
import { setResponse, addMessageToHistory, ChatMessage } from '../store/aiSlice';
import { AppDispatch } from '../store';
import { styles } from '../styles/StartScreen.styles';
import { MovieShowtimeAPI } from '../services';
import { searchMovies } from '../store/movieSlice';
import { useRoute } from '@react-navigation/native';
import navigationHistory from '../services/navigationHistory';
import { COLORS } from '../styles/theme';
import NavigationHeader from '../components/NavigationHeader';

const prompts = [
  {
    title: "Movies that are currently playing",
    action: "What movies are currently playing?"
  },
  {
    title: "Find cinemas around me",
    action: "What are the closest cinema theaters near me? Show me a list of nearby cinemas around my location."
  },
  {
    title: "View showtimes of The Amateur",
    action: "Show me showtimes for The Amateur"
  }
];

const StartScreen = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [canGoForward, setCanGoForward] = useState(false);
  const route = useRoute<any>();
  
  // Initialize and track navigation history
  useEffect(() => {
    const initNavHistory = async () => {
      await navigationHistory.initialize();
      navigationHistory.addToHistory(route.name, route.params);
      setCanGoForward(navigationHistory.canGoForward());
    };
    
    initNavHistory();
    
    const unsubscribe = navigation.addListener('state', () => {
      setCanGoForward(navigationHistory.canGoForward());
    });
    
    return () => unsubscribe();
  }, [navigation, route.name, route.params]);
  
  // Handle forward navigation
  const handleForwardPress = () => {
    const nextScreen = navigationHistory.goForward();
    if (nextScreen) {
      navigation.navigate(nextScreen.routeName, nextScreen.params);
    }
  };
  
  const loadMovies = useCallback(async () => {
    if (retryCount === 0) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      console.log(`Attempting to load movies using TMDb API (attempt ${retryCount + 1})`);
      const movieData = await MovieShowtimeAPI.getMovies();
      setMovies(movieData || []);
      console.log(`Successfully loaded ${movieData.length} movies from TMDb`);
    } catch (error) {
      console.error("Error loading movies:", error);
      setError("Failed to load movies");
      
      if (retryCount < 1) {
        console.log(`Retrying after error. Retry count: ${retryCount + 1}`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadMovies();
        }, 2000 * (retryCount + 1));
      }
    } finally {
      setIsLoading(false);
    }
  }, [retryCount]);
  
  useEffect(() => {
    loadMovies();
  }, [loadMovies]);
  
  useEffect(() => {
    dispatch(setResponse("Welcome to Movie Showtime! Ask me about movies, cinemas, or showtimes."));
  }, [dispatch]);
  
  // Handle prompts by submitting them as user messages to the AI
  const handlePromptPress = (action: string) => {
    console.log('Prompt pressed:', action);
    
    const m = action.match(/showtimes for (.+)$/i);
    if (m) {
      const title = m[1].trim();
      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      const local = new Date(now.getTime() - tzOffset);
      const todayISO = local.toISOString().slice(0, 10);

      navigation.navigate('MovieShowtime', {
        movieTitle: title,
        date: todayISO,
        fromAI: true
      });
      return;
    }
    

    const userMessage: ChatMessage = { role: 'user', content: action };

    dispatch(addMessageToHistory(userMessage));

    dispatch(setResponse(`Processing your request: "${action}"`));

    console.log(`Prompt submitted to AI: ${action}`);
  };
  
  const renderMoviePosters = () => {
    const moviePosters = movies.slice(0, 6).map((movie, index) => (
      <Image 
        key={index} 
        source={{ uri: movie.poster }} 
        style={styles.posterImage} 
        resizeMode="cover"
      />
    ));
    
    return (
      <>
        {moviePosters}
      </>
    );
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <NavigationHeader 
          title="What can I help with?" 
          backgroundColor={COLORS.gunmetal} 
          titleColor="#FFFFFF"
          fontSize={18}
          customForwardAction={canGoForward ? handleForwardPress : undefined}
        />
        <ScrollView contentContainerStyle={styles.wrapper}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {error}
                {retryCount > 0 ? ' (Retrying...)' : ''}
              </Text>
            </View>
          )}
          
          <View style={styles.promptsContainer}>
            <TouchableOpacity 
              style={styles.promptCard}
              onPress={() => handlePromptPress(prompts[0].action)}
            >
              <View style={styles.promptCardContent}>
                <View style={styles.promptTextContainer}>
                  <Text style={styles.promptText}>{prompts[0].title}</Text>
                  <View style={styles.chevronIcon}>
                    <Ionicons name="chevron-forward" size={24} color="#404040" />
                  </View>
                </View>
                {!isLoading && movies.length > 0 ? (
                  <View style={styles.iconsContainer}>
                    {renderMoviePosters()}
                  </View>
                ) : isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#8A8A8E" />
                  </View>
                ) : (
                  <View style={styles.iconsContainer}>
                    {[...Array(6)].map((_, index) => (
                      <View key={index} style={styles.iconPlaceholder} />
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.promptCard}
              onPress={() => handlePromptPress(prompts[1].action)}
            >
              <View style={styles.promptCardContent}>
                <View style={styles.promptTextContainer}>
                  <Text style={styles.promptText}>{prompts[1].title}</Text>
                  <View style={styles.chevronIcon}>
                    <Ionicons name="chevron-forward" size={24} color="#404040" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.promptCard}
              onPress={() => handlePromptPress(prompts[2].action)}
            >
              <View style={styles.promptCardContent}>
                <View style={styles.promptTextContainer}>
                  <Text style={styles.promptText}>{prompts[2].title}</Text>
                  <View style={styles.chevronIcon}>
                    <Ionicons name="chevron-forward" size={24} color="#404040" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
      
      <AIChatBox />
    </View>
  );
};

export default StartScreen; 