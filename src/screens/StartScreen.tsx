import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image, ActivityIndicator, StatusBar } from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import AIChatBox from '../components/AIChatBox';
import { setResponse } from '../store/aiSlice';
import { AppDispatch } from '../store';
import { styles } from '../styles/StartScreen.styles';
import { MovieShowtimeAPI } from '../services';

const prompts = [
  {
    title: "Movies that are currently playing",
    action: "movies currently playing"
  },
  {
    title: "Find cinemas around me",
    action: "closest cinemas"
  },
  {
    title: "View showtimes of The Martian",
    action: "showtimes for The Martian"
  }
];

const StartScreen = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
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
  
  const handlePromptPress = (action: string) => {
    dispatch(setResponse(`You asked about: "${action}"`));
    
    if (action === "movies currently playing") {
      navigation.navigate('MovieGallery');
    } else if (action === "closest cinemas") {
      navigation.navigate('CinemaGallery');
    } else if (action === "showtimes for The Martian") {
      const today = new Date().toISOString().split('T')[0];
      navigation.navigate('MovieShowtime', { 
        movieId: '184126',
        movieTitle: "The Martian",
        poster: 'https://via.placeholder.com/500x750?text=The+Martian'
      });
    }
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
        <ScrollView contentContainerStyle={styles.wrapper}>
          {/* Page Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>What can I help with?</Text>
          </View>
          
          {/* Error message if present */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {error}
                {retryCount > 0 ? ' (Retrying...)' : ''}
              </Text>
            </View>
          )}
          
          {/* Prompts */}
          <View style={styles.promptsContainer}>
            {/* Movies Currently Playing */}
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
            
            {/* Find Cinemas Around Me */}
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
            
            {/* View Showtimes of The Martian */}
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