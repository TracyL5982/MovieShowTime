import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  Linking, 
  Platform,
  StyleSheet,
  Alert,
  FlatList
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchCinema, fetchCinemas } from '../store/cinemaSlice';
import { AppDispatch } from '../store';
import { Ionicons } from '@expo/vector-icons';
import AIChatBox from '../components/AIChatBox';
import { MovieShowtimeAPI } from '../services';
import { styles } from '../styles/CinemaDetails.styles';
import { Feather } from '@expo/vector-icons';
import OpenAI from 'openai';
import NavigationHeader from '../components/NavigationHeader';
import { COLORS } from '../styles/colors';
import { OPENAI_CONFIG } from '../config/apiKeys';

const openai = new OpenAI(OPENAI_CONFIG);
const cinemaImage = require('../../assets/images/cinema.jpg');

const CinemaDetails = ({ route, navigation }) => {
  const { 
    cinemaId, 
    cinemaName, 
    description, 
    url, 
    address, 
    distance,
    location,
    city,
    state,
    aiCinemaData 
  } = route.params;
  
  const dispatch = useDispatch<AppDispatch>();
  const { cinemas, selectedCinema, loading, error } = useSelector((state: RootState) => state.cinemas);
  const { movies } = useSelector((state: RootState) => state.movies);
  const { chatboxHeight } = useSelector((state: RootState) => state.ai);
  const [aiCinema, setAiCinema] = useState(null);
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [featuredMoviesLoading, setFeaturedMoviesLoading] = useState(false);

  useEffect(() => {
    if (aiCinemaData) {
      console.log('Using passed aiCinemaData:', {
        name: aiCinemaData.name,
        address: aiCinemaData.address,
        description: aiCinemaData.description?.substring(0, 50) + '...'
      });
      setAiCinema(aiCinemaData);
    } else if (cinemaName) {
      console.log('Creating fallback cinema with:', {
        name: cinemaName,
        address: address || 'Address not available'
      });
      const fallbackCinema = createFallbackCinema(
        cinemaName,
        description,
        address,
        distance,
        location,
        url
      );
      setAiCinema(fallbackCinema);
    }
  }, [aiCinemaData, cinemaName, description, address, distance, location, url]);

  useEffect(() => {
    if (cinemaName && !cinemaId && !aiCinemaData) {
      dispatch(fetchCinemas(20));
    }
  }, [dispatch, cinemaName, cinemaId, aiCinemaData]);

  useEffect(() => {
    if (aiCinemaData || aiCinema) return;
    
    if (cinemaId) {
      dispatch(fetchCinema(cinemaId));
    } else if (cinemaName && cinemas.length > 0) {
      const matchingCinema = findMatchingCinema(cinemaName, cinemas);
      
    if (matchingCinema) {
        console.log('Found matching cinema from name:', matchingCinema.name);
        dispatch(fetchCinema(matchingCinema.id));
      }
    }
  }, [dispatch, cinemaId, cinemaName, cinemas, aiCinemaData, aiCinema]);

  const findMatchingCinema = (name, cinemasList) => {
    const nameLower = name.toLowerCase();
    let match = cinemasList.find(cinema => 
      cinema.name.toLowerCase() === nameLower
    );
    if (!match) {
      match = cinemasList.find(cinema => 
        cinema.name.toLowerCase().includes(nameLower) || 
        nameLower.includes(cinema.name.toLowerCase())
      );
    }
    
    return match;
  };
  
  const createFallbackCinema = (
    name, 
    description = '', 
    address = '',
    distance = null,
    location = null,
    url = ''
  ) => {
    return {
      id: `ai-cinema-${Date.now()}`,
      name: name,
      description: description || '',
      url: url || '',
      address: address || '',
      city: city || '',
      state: state || '',
      postalCode: '',
      location: location,
      distance: distance,
      logo: null
    };
  };

  useEffect(() => {
    const fetchFeaturedMovies = async () => {
      if (!aiCinema && !selectedCinema) return;
      
      const cinema = selectedCinema || aiCinema;
      console.log('Fetching featured movies for cinema:', cinema.name);
      
      setFeaturedMoviesLoading(true);
      
      try {
        const prompt = `What are the top 6 popular movies currently showing at ${cinema.name} located in ${cinema.city || cinema.address || 'the US'}?
        Format your response as a simple list with only the movie titles and year in parentheses:
        - Movie Title (year)
        - Movie Title (year)
        etc.
        If this cinema doesn't exist or you cannot find specific movies, list 6 top movies currently playing in theaters in the US.`;
        
        console.log('Sending OpenAI prompt:', prompt);
        
        const userLocationConfig = {
          type: "approximate" as const,
          country: "US",
          city: cinema.city || "New York",
          region: cinema.state || "NY"
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
        });
        
        let moviesText = '';
        
        if (response && response.output_text) {
          moviesText = response.output_text;
          console.log('Found output_text in response:', moviesText.substring(0, 100));
        }
        
        console.log('AI response for featured movies:', moviesText);
        
        if (!moviesText || moviesText.trim() === '') {
          console.warn('Empty response from OpenAI');
          throw new Error('Failed to get movie list from OpenAI');
        }
        
        const moviePattern = /[•\-\*]?\s*([^(]+)\s*\((\d{4})\)/g;
        let match;
        const moviesPromises = [];
        
        while ((match = moviePattern.exec(moviesText)) !== null) {
          const title = match[1].trim();
          const year = match[2].trim();
          
          moviesPromises.push(
            MovieShowtimeAPI.searchMovies(title)
              .then(searchResult => {
                if (searchResult && searchResult.length > 0) {
                  let matchingMovie = searchResult.find(movie => 
                    movie.releaseDate && movie.releaseDate.substring(0, 4) === year
                  );
                  
                  if (!matchingMovie) {
                    matchingMovie = searchResult[0];
                  }
                  
                  const movieFromApi = matchingMovie as any;
                  if (movieFromApi.poster_path && !matchingMovie.poster) {
                    matchingMovie.poster = `https://image.tmdb.org/t/p/w500${movieFromApi.poster_path}`;
                  }
                  
                  console.log(`Found poster for "${title}" (${year}): ${matchingMovie.poster || 'No poster'}`);
                  return matchingMovie;
                }
                return null;
              })
              .catch(error => {
                console.error(`Error finding poster for movie "${title}":`, error);
                return null;
              })
          );
        }
        
        const moviesResults = await Promise.all(moviesPromises);
        const validMovies = moviesResults.filter(movie => movie !== null);
        
        console.log(`Found ${validMovies.length} movies with posters`);
        setFeaturedMovies(validMovies);
      } catch (error) {
        console.error('Error fetching featured movies:', error);
        if (movies && movies.length > 0) {
          console.log('Using fallback movies from API');
          setFeaturedMovies(movies.slice(0, 6));
        }
      } finally {
        setFeaturedMoviesLoading(false);
      }
    };
    
    fetchFeaturedMovies();
  }, [selectedCinema, aiCinema, movies]);

  const openCinemaUrl = () => {
    const cinema = selectedCinema || aiCinema;
    let urlToOpen = cinema?.url || route.params?.url;
    
    if (!urlToOpen) {
      Alert.alert(
        "Website Unavailable",
        "No website information is available for this cinema.",
        [{ text: "OK" }]
      );
    } else {
      console.log('Opening URL:', urlToOpen);
      Linking.openURL(urlToOpen).catch(err => {
        console.error('Error opening URL:', err);
        Alert.alert(
          "Error",
          "Could not open the cinema's website. The URL may be invalid.",
          [{ text: "OK" }]
        );
      });
    }
  };

  const handleMoviePress = (movie) => {
    navigation.navigate('MovieDetails', { 
      movieId: movie.id,
      title: movie.title
    });
  };

  const dynamicStyles = StyleSheet.create({
    scrollViewContent: {
      ...styles.contentContainer,
      paddingBottom: chatboxHeight > 0 ? chatboxHeight + 20 : 120, 
    }
  });

  if (loading && !aiCinema) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FEBD69" />
        <Text style={styles.loadingText}>Loading cinema details...</Text>
      </View>
    );
  }

  if (error && !aiCinema) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!selectedCinema && !aiCinema) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Cinema not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cinema = selectedCinema || aiCinema;

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        {/* NavigationHeader */}
        <NavigationHeader 
          title={cinema.name || 'Cinema Details'} 
          backgroundColor={COLORS.gunmetal}
        />

        <ScrollView 
          contentContainerStyle={dynamicStyles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cinema Image */}
          <View style={styles.cinemaImageContainer}>
            <Image 
              source={cinemaImage}
              style={styles.cinemaImage}
              resizeMode="cover"
            />
          </View>

          {/* Cinema Info */}
          <View style={styles.cinemaInfoContainer}>
            {/* Cinema Name */}
              <Text style={styles.cinemaName}>{cinema.name}</Text>
            
            {/* Distance on a new line */}
              <View style={styles.distanceContainer}>
              <Ionicons name="location" size={16} color="#FEBD69" style={styles.locationIcon} />
              {cinema.distance ? (
                <Text style={styles.distanceText}>{cinema.distance.toFixed(1)} miles away</Text>
              ) : (
                <Text style={styles.distanceText}>Distance unavailable</Text>
              )}
              </View>
            
            {/* Address line */}
            <View style={styles.cityContainer}>
              {cinema.address ? (
                <Text style={styles.cityText}>{cinema.address}</Text>
              ) : (
                <Text style={styles.cityText}>Address unavailable</Text>
              )}
            </View>
            
            {/* Description section */}
            {cinema.description || route.params?.description ? (
              <Text style={styles.descriptionText}>
                {cinema.description || route.params?.description}
              </Text>
            ) : (
              <Text style={styles.descriptionText}>
                No description available for this cinema.
            </Text>
            )}
          </View>

          {/* Featured Movies Section */}
          <View style={featuredMoviesStyles.featuredMoviesContainer}>
            <Text style={featuredMoviesStyles.featuredMoviesTitle}>Featured Movies</Text>
            
            {featuredMoviesLoading ? (
              <View style={featuredMoviesStyles.featuredMoviesLoadingContainer}>
                <ActivityIndicator size="small" color="#FEBD69" />
                <Text style={styles.loadingText}>Loading featured movies...</Text>
              </View>
            ) : featuredMovies.length > 0 ? (
              <FlatList
                data={featuredMovies}
                keyExtractor={(item) => item.id.toString()}
              horizontal 
              showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                <TouchableOpacity 
                    style={featuredMoviesStyles.moviePosterContainer}
                    onPress={() => handleMoviePress(item)}
                  >
                    {item.poster ? (
                      <Image
                        source={{ uri: item.poster }}
                        style={featuredMoviesStyles.moviePoster}
                        resizeMode="cover"
                      />
                    ) : (item as any).poster_path ? (
                  <Image 
                        source={{ uri: `https://image.tmdb.org/t/p/w500${(item as any).poster_path}` }}
                        style={featuredMoviesStyles.moviePoster}
                    resizeMode="cover"
                  />
                    ) : (
                      <View style={featuredMoviesStyles.noMoviePoster}>
                        <Text style={featuredMoviesStyles.noMoviePosterText}>{item.title}</Text>
                      </View>
                    )}
                    <Text style={featuredMoviesStyles.movieTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text style={featuredMoviesStyles.noFeaturedMoviesText}>
                No featured movies information available
              </Text>
            )}
          </View>

          {/* Cinema Website Button */}
          <View style={[styles.websiteContainer, { marginTop: 30 }]}>
            <TouchableOpacity 
              style={styles.websiteButton}
              onPress={openCinemaUrl}
            >
              <Feather name="external-link" size={20} color="#000000" style={styles.websiteIcon} />
              <Text style={styles.websiteButtonText}>Open Cinema Website</Text>
                </TouchableOpacity>
              </View>
        </ScrollView>
      </SafeAreaView>
      <AIChatBox />
    </View>
  );
};

// Define featured movies styles 
const featuredMoviesStyles = StyleSheet.create({
  featuredMoviesContainer: {
    marginTop: 0,
    padding: 15,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  featuredMoviesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F7F9FA',
    marginBottom: 15,
  },
  featuredMoviesLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  moviePosterContainer: {
    marginRight: 12,
    width: 120,
    alignItems: 'center',
  },
  moviePoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  noMoviePoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#1E3A5F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  noMoviePosterText: {
    color: '#F7F9FA',
    textAlign: 'center',
    fontSize: 12,
  },
  movieTitle: {
    color: '#F7F9FA',
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    width: 120,
  },
  noFeaturedMoviesText: {
    color: '#F7F9FA',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
});

export default CinemaDetails; 