import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Linking,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedMovie } from '../store/movieSlice';
import { RootState } from '../store/index';
import { AppDispatch } from '../store';
import AIChatBox from '../components/AIChatBox';
import { store } from '../store';
import { styles } from '../styles/MovieDetails.styles';
import { MovieShowtimeAPI, Movie, Showtime } from '../services';

const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/70x70?text=No+Image';

const MovieDetails = ({ route, navigation }) => {
  const { movieId, movieTitle } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedShowing, setSelectedShowing] = useState<Showtime | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const fetchMovieData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let movieData: Movie | null = null;
      
      if (movieId) {
        const state = store.getState();
        const existingMovie = state.movies.movies.find(m => m.id === movieId);
        
        if (existingMovie && existingMovie.showtimes && existingMovie.showtimes.length > 0) {
          movieData = existingMovie;
          console.log('Using cached movie data for', movieData.title);
        } else {
          console.log('Fetching movie details for ID:', movieId);         
          const details = await MovieShowtimeAPI.getMovieDetails(parseInt(movieId));
          const showtimes = await MovieShowtimeAPI.getShowtimesForMovie(movieId);
          const mappedShowtimes = showtimes.map(s => ({
            time: s.time,
            date: s.date,
            theater: s.theater,
            price: parseFloat(s.price),
          }));
          
          movieData = {
            id: movieId,
            title: details?.title || movieTitle || 'Unknown Movie',
            poster: details?.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
            backdrop: details?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : undefined,
            rating: details?.vote_average || 0,
            description: details?.overview || 'No description available',
            cast: details?.credits?.cast?.slice(0, 5).map(actor => actor.name) || [],
            releaseDate: details?.release_date,
            runtime: details?.runtime,
            genres: details?.genres?.map(genre => genre.name) || [],
            showtimes: mappedShowtimes,
            ageRating: details?.adult ? 'R' : 'PG-13',
            directors: details?.credits?.crew?.filter(person => person.job === 'Director').map(director => director.name) || [],
            distributors: details?.production_companies?.map(company => company.name) || [],
            trailers: details?.videos?.results || []
          };
          
          setUsingFallback(false);
        }
      } else if (movieTitle) {
        console.log('Searching for movie by title:', movieTitle);
        
        const state = store.getState();
        const existingMovie = state.movies.movies.find(
          m => m.title.toLowerCase() === movieTitle.toLowerCase()
        );
        
        if (existingMovie) {
          movieData = existingMovie;
          console.log('Found movie in state:', movieData.title);
          setUsingFallback(false);
        } else {
          console.warn('Movie not found by title, using fallback movie data');
          movieData = generateFallbackMovie(movieTitle);
          setUsingFallback(true);
        }
      }
      
      if (movieData) {
        setMovie(movieData);
        if (movieData.showtimes && movieData.showtimes.length > 0) {
          const dates = [...new Set(movieData.showtimes.map(s => s.date))];
          if (dates.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const todayShowtimes = dates.find(d => d === today);
            setSelectedDate(todayShowtimes || dates[0]);
          }
        }
      } else {
        throw new Error('Could not load movie data');
      }
    } catch (err) {
      console.error('Error in fetchMovieData:', err);
      setError('Failed to load movie details. Pull down to retry.');
      if (retryCount < 2 && (movieId || movieTitle)) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchMovieData();
        }, 1500 * (retryCount + 1)); 
      } else if (movieTitle) {
        const fallbackMovie = generateFallbackMovie(movieTitle);
        setMovie(fallbackMovie);
        setUsingFallback(true);
        setError('Using offline data. Some information might not be accurate.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [movieId, movieTitle, retryCount]);
  
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRetryCount(0); 
    fetchMovieData();
  }, [fetchMovieData]);
  
  useEffect(() => {
    fetchMovieData();
  }, [fetchMovieData]);
  
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedShowing(null);
  };
  
  const handleShowtimeSelect = (showtime: Showtime) => {
    setSelectedShowing(showtime);
  };
  
  const handleBooking = () => {
    if (movie) {
      navigation.navigate('MovieShowtime', {
        movieId: movie.id,
        movieTitle: movie.title,
        poster: movie.poster
      });
    }
  };

  const formatRuntime = (minutes) => {
    if (!minutes) return 'Unknown duration';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatReleaseYear = () => {
    if (!movie?.releaseDate) return '';
    return new Date(movie.releaseDate).getFullYear();
  };

  const renderStars = (rating) => {
    if (!rating) return 'No rating';
    const stars = Math.round(rating / 2);
    return `${stars}/5 ★`;
  };

  const generateFallbackMovie = (title: string): Movie => {
    return {
      id: `fallback-${Date.now()}`,
      title: title,
      poster: 'https://via.placeholder.com/500x750?text=' + encodeURIComponent(title),
      rating: 0,
      description: 'Movie information is currently unavailable. Please check back later.',
      cast: ['Cast information unavailable'],
      showtimes: generateFallbackShowtimes(),
      releaseDate: new Date().getFullYear().toString(),
      runtime: 120,
      genres: ['Unknown'],
      ageRating: 'PG-13',
      directors: ['Unknown Director'],
      distributors: ['Unknown Studio'],
      trailers: []
    };
  };
  
  const generateFallbackShowtimes = (): import('../services/tmdb').Showtime[] => {
    const showtimes: import('../services/tmdb').Showtime[] = [];
    const theaters = [
      'AMC Theater Downtown',
      'Regal Cinemas Westfield',
      'Cinemark Eastgate',
      'Alamo Drafthouse'
    ];
    
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      theaters.forEach(theater => {
        const times = ['14:30', '17:45', '20:15', '22:30'];
        const randomTimes = times.sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 2));
        
        randomTimes.forEach(time => {
          showtimes.push({
            time,
            date: dateString,
            theater,
            price: 12.99 
          });
        });
      });
    }
    
    return showtimes;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FEBD69" />
        <Text style={styles.loadingText}>Loading movie details...</Text>
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Failed to load movie details.'}</Text>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderCastSection = () => {
    if (!movie.cast || movie.cast.length === 0) {
      return <Text style={styles.castInfo}>Cast information not available</Text>;
    }

    return (
      <View style={styles.castSection}>
        <Text style={styles.sectionTitle}>Cast</Text>
        <View style={styles.castRow}>
          {movie.cast.map((actor, index) => (
            <View key={index} style={styles.castItem}>
              <Image 
                source={{ uri: PLACEHOLDER_AVATAR }} 
                style={styles.castImage} 
              />
              <Text style={styles.castName} numberOfLines={2}>{actor}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderCrewSection = () => {
    const hasDirectors = movie.directors && movie.directors.length > 0;
    const hasDistributors = !!movie.distributors;

    if (!hasDirectors && !hasDistributors) {
      return (
        <>
          <Text style={styles.directorsInfo}>Director information not available</Text>
          <Text style={styles.producersInfo}>Producer information not available</Text>
        </>
      );
    }

    return (
      <>
        {hasDirectors && (
          <View style={styles.crewSection}>
            <Text style={styles.sectionTitle}>Directors</Text>
            <View style={styles.crewRow}>
              {movie.directors.map((director, index) => (
                <View key={index} style={styles.crewItem}>
                  <Image 
                    source={{ uri: PLACEHOLDER_AVATAR }} 
                    style={styles.crewImage} 
                  />
                  <Text style={styles.crewName} numberOfLines={2}>{director}</Text>
                  <Text style={styles.crewRole}>Director</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {hasDistributors && (
          <View style={styles.crewSection}>
            <Text style={styles.sectionTitle}>Production</Text>
            <View style={styles.crewRow}>
              <View style={styles.crewItem}>
                <Image 
                  source={{ uri: PLACEHOLDER_AVATAR }} 
                  style={styles.crewImage} 
                />
                <Text style={styles.crewName} numberOfLines={2}>{movie.distributors}</Text>
                <Text style={styles.crewRole}>Distributor</Text>
              </View>
            </View>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        {/* Fixed Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#F7F9FA" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Movie Details</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Movie Poster */}
          <View style={styles.posterContainer}>
            <Image 
              source={{ uri: movie?.poster || 'https://via.placeholder.com/500x750?text=No+Poster' }} 
              style={styles.posterImage} 
              resizeMode="cover"
            />
          </View>
          
          {/* Movie Info Frame */}
          <View style={styles.movieInfoContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.movieTitle}>{movie?.title || 'Movie Name'}</Text>
            </View>
            
            <View style={styles.releaseInfoRow}>
              <Text style={styles.releaseInfo}>
                {renderStars(movie?.rating)} | {formatRuntime(movie?.runtime)}
              </Text>
              <Text style={styles.releaseYear}>
                {formatReleaseYear()}
              </Text>
            </View>
            
            <View style={styles.genreRow}>
              <Text style={styles.ageRating}>
                {movie?.ageRating || 'Age rating'} |
              </Text>
              {movie?.genres && movie.genres.map((genre, index) => (
                <View key={index} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* View Showtimes Button */}
          <TouchableOpacity 
            style={styles.showTimesButton}
            onPress={handleBooking}
          >
            <Text style={styles.showTimesButtonText}>View Showtimes</Text>
          </TouchableOpacity>
          
          {/* Details Frame */}
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Synopsis</Text>
            <Text style={styles.synopsis}>{movie?.description || 'Synopsis not available'}</Text>
            
            {/* Cast Section with Images */}
            {renderCastSection()}
            
            {/* Crew Section with Images */}
            {renderCrewSection()}
            
            {/* Writers info if available */}
            <Text style={styles.writersInfo}>
              Writers: Information not available
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      <AIChatBox />
    </View>
  );
};

export default MovieDetails; 