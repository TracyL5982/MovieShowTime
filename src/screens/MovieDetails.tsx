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
  RefreshControl,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedMovie, searchMovies } from '../store/movieSlice';
import { RootState } from '../store/index';
import { AppDispatch } from '../store';
import AIChatBox from '../components/AIChatBox';
import { store } from '../store';
import { styles } from '../styles/MovieDetails.styles';
import NavigationHeader from '../components/NavigationHeader';
import { MovieShowtimeAPI, Movie, Showtime, FilmPerson } from '../services';
import * as TMDbAPI from '../services/tmdb';
import { TMDB_API_KEY } from '../config/apiKeys';
import { COLORS } from '../styles/colors';

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
  const { movies } = useSelector((state: RootState) => state.movies);
  const { chatboxHeight } = useSelector((state: RootState) => state.ai);

  const fetchMovieData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let movieData: Movie | null = null;
      
      if (movieId) {
        const existingMovie = movies.find(m => m.id === movieId);
        
        if (existingMovie && existingMovie.showtimes && existingMovie.showtimes.length > 0) {
          movieData = existingMovie;
          console.log('Using cached movie data for', movieData.title);
        } else {
          console.log('Fetching movie details for ID:', movieId);         
          const details = await MovieShowtimeAPI.getMovieDetails(parseInt(movieId));
          const showtimes = await MovieShowtimeAPI.getShowtimesForMovie(movieId);
          
          let ageRating = 'PG-13'; 
          
          try {
            const releaseDatesResponse = await fetch(
              `https://api.themoviedb.org/3/movie/${movieId}/release_dates?api_key=${TMDB_API_KEY}`
            );
            const releaseDatesData = await releaseDatesResponse.json();
            
            if (releaseDatesData?.results) {
              const usReleases = releaseDatesData.results.find(
                country => country.iso_3166_1 === 'US'
              );
              
              if (usReleases?.release_dates?.length > 0) {
                const certification = usReleases.release_dates.find(
                  release => release.certification && release.certification.length > 0
                )?.certification;
                
                if (certification) {
                  ageRating = certification;
                }
              }
            }
          } catch (certError) {
            console.error('Error fetching certification:', certError);
          }
          
          const mappedShowtimes = showtimes.map(s => ({
            time: s.time,
            date: s.date,
            theater: s.theater,
            price: typeof s.price === 'string' ? parseFloat(s.price.replace('$', '')) : s.price,
          }));
          
          const castWithProfiles = details?.credits?.cast?.slice(0, 5).map(actor => ({
            name: actor.name,
            profile_path: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : PLACEHOLDER_AVATAR
          })) || [];
          
          const directors = details?.credits?.crew
            ?.filter(person => person.job === 'Director')
            .map(director => ({
              name: director.name,
              profile_path: director.profile_path ? `https://image.tmdb.org/t/p/w185${director.profile_path}` : PLACEHOLDER_AVATAR
            })) || [];
            
          const writers = details?.credits?.crew
            ?.filter(person => ['Writer', 'Screenplay'].includes(person.job))
            .map(writer => ({
              name: writer.name,
              job: writer.job,
              profile_path: writer.profile_path ? `https://image.tmdb.org/t/p/w185${writer.profile_path}` : PLACEHOLDER_AVATAR
            })) || [];
          
          movieData = {
            id: movieId,
            title: details?.title || movieTitle || 'Unknown Movie',
            poster: details?.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
            backdrop: details?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : undefined,
            rating: details?.vote_average || 0,
            description: details?.overview || 'No description available',
            cast: castWithProfiles,
            releaseDate: details?.release_date,
            runtime: details?.runtime,
            genres: details?.genres?.map(genre => genre.name) || [],
            showtimes: mappedShowtimes,
            ageRating: ageRating,
            directors: directors,
            writers: writers,
            distributors: details?.production_companies?.map(company => company.name) || [],
            trailers: details?.videos?.results || []
          };
          
          setUsingFallback(false);
        }
      } else if (movieTitle) {
        console.log('Searching for movie by title:', movieTitle);
        
        const existingMovie = movies.find(
          m => m.title.toLowerCase() === movieTitle.toLowerCase()
        );
        
        if (existingMovie) {
          movieData = existingMovie;
          console.log('Found movie in state:', movieData.title);
          setUsingFallback(false);
        } else {
          try {
            console.log('Searching TMDB for movie:', movieTitle);
            const searchResults = await dispatch(searchMovies(movieTitle)).unwrap();
            console.log('Search results:', searchResults?.length || 0);
            
            if (searchResults && searchResults.length > 0) {
              const bestMatch = searchResults.find(m => 
                m.title.toLowerCase() === movieTitle.toLowerCase()
              ) || searchResults[0];
              
              console.log('Using best match from search:', bestMatch.title);
              
              const details = await MovieShowtimeAPI.getMovieDetails(parseInt(bestMatch.id));
              
              const showtimes = await MovieShowtimeAPI.getShowtimesForMovie(bestMatch.id);
              
              const castWithProfiles = details?.credits?.cast?.slice(0, 5).map(actor => ({
                name: actor.name,
                profile_path: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : PLACEHOLDER_AVATAR
              })) || [];
              
              let ageRating = 'PG-13'; 
              if (details?.release_dates?.results) {
                const usReleases = details.release_dates.results.find(
                  country => country.iso_3166_1 === 'US'
                );
                
                if (usReleases?.release_dates?.length > 0) {
                  const certification = usReleases.release_dates.find(
                    release => release.certification && release.certification.length > 0
                  )?.certification;
                  
                  if (certification) {
                    ageRating = certification;
                  }
                }
              }
              
              const directors = details?.credits?.crew
                ?.filter(person => person.job === 'Director')
                .map(director => ({
                  name: director.name,
                  profile_path: director.profile_path ? `https://image.tmdb.org/t/p/w185${director.profile_path}` : PLACEHOLDER_AVATAR
                })) || [];
                
              const writers = details?.credits?.crew
                ?.filter(person => ['Writer', 'Screenplay'].includes(person.job))
                .map(writer => ({
                  name: writer.name,
                  job: writer.job,
                  profile_path: writer.profile_path ? `https://image.tmdb.org/t/p/w185${writer.profile_path}` : PLACEHOLDER_AVATAR
                })) || [];
              
              movieData = {
                ...bestMatch,
                showtimes: showtimes.map(s => ({
                  time: s.time,
                  date: s.date,
                  theater: s.theater,
                  price: typeof s.price === 'string' ? parseFloat(s.price.replace('$', '')) : s.price,
                })),
                cast: castWithProfiles,
                ageRating: ageRating,
                directors: directors,
                writers: writers
              };
              
              setUsingFallback(false);
            } else {
              console.warn('Movie not found in search, using fallback data');
              movieData = generateFallbackMovie(movieTitle);
              setUsingFallback(true);
            }
          } catch (searchError) {
            console.error('Error searching for movie:', searchError);
            movieData = generateFallbackMovie(movieTitle);
            setUsingFallback(true);
          }
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
  }, [movieId, movieTitle, retryCount, dispatch, movies]);
  
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
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
        id: movie.id,
        title: movie.title,
        poster: movie.poster,
        date: new Date().toISOString().split('T')[0],
        fromAI: route.params?.fromAI || false
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
    return `${rating.toFixed(1)}/10`;
  };

  const generateFallbackMovie = (title: string): Movie => {
    return {
      id: `fallback-${Date.now()}`,
      title: title,
      poster: 'https://via.placeholder.com/500x750?text=' + encodeURIComponent(title),
      rating: 0,
      description: 'Movie information is currently unavailable. Please check back later.',
      cast: [{ 
        name: 'Cast information unavailable', 
        profile_path: PLACEHOLDER_AVATAR 
      }],
      showtimes: generateFallbackShowtimes(),
      releaseDate: new Date().getFullYear().toString(),
      runtime: 120,
      genres: ['Unknown'],
      ageRating: 'PG-13',
      directors: [{ 
        name: 'Unknown Director', 
        profile_path: PLACEHOLDER_AVATAR 
      }],
      writers: [{ 
        name: 'Unknown Writer', 
        job: 'Writer', 
        profile_path: PLACEHOLDER_AVATAR 
      }],
      distributors: ['Unknown Studio'],
      trailers: []
    };
  };
  
  const generateFallbackShowtimes = (): TMDbAPI.Showtime[] => {
    const showtimes: TMDbAPI.Showtime[] = [];
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

  // Create dynamic styles based on chatbox height
  const dynamicStyles = StyleSheet.create({
    contentPadding: {
      paddingBottom: chatboxHeight > 0 ? chatboxHeight + 20 : 120, 
    }
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FEBD69" />
          <Text style={styles.loadingText}>Loading movie details...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={{ 
              padding: 12, 
              backgroundColor: '#FEBD69', 
              borderRadius: 8, 
              marginTop: 16,
              alignItems: 'center'
            }}
            onPress={() => {
              setRetryCount(0);
              fetchMovieData();
            }}
          >
            <Text style={{ 
              color: '#232F3E', 
              fontWeight: 'bold', 
              fontSize: 16 
            }}>Try Again</Text>
          </TouchableOpacity>
        </View>
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
                source={{ uri: actor.profile_path || PLACEHOLDER_AVATAR }} 
                style={styles.castImage} 
              />
              <Text style={styles.castName} numberOfLines={2}>{actor.name}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderCrewSection = () => {
    const hasDirectors = movie.directors && movie.directors.length > 0;
    const hasDistributors = movie.distributors && movie.distributors.length > 0;
    const hasWriters = movie.writers && movie.writers.length > 0;

    if (!hasDirectors && !hasDistributors && !hasWriters) {
      return null;
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
                    source={{ uri: director.profile_path }} 
                    style={styles.crewImage} 
                  />
                  <Text style={styles.crewName} numberOfLines={2}>{director.name}</Text>
                  <Text style={styles.crewRole}>Director</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {hasWriters && (
          <View style={styles.crewSection}>
            <Text style={styles.sectionTitle}>Writers</Text>
            <View style={styles.crewRow}>
              {movie.writers.map((writer, index) => (
                <View key={index} style={styles.crewItem}>
                  <Image 
                    source={{ uri: writer.profile_path }} 
                    style={styles.crewImage} 
                  />
                  <Text style={styles.crewName} numberOfLines={2}>{writer.name}</Text>
                  <Text style={styles.crewRole}>{writer.job || 'Writer'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {hasDistributors && (
          <View style={styles.crewSection}>
            <Text style={styles.sectionTitle}>Production</Text>
            <View style={styles.distributorsContainer}>
              {typeof movie.distributors === 'string' ? (
                <Text style={styles.distributorText}>{movie.distributors}</Text>
              ) : (
                movie.distributors.map((distributor, index) => (
                  <Text key={index} style={styles.distributorText}>{distributor}</Text>
                ))
              )}
            </View>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        {/* NavigationHeader */}
        <NavigationHeader 
          title={movie?.title || 'Movie Details'} 
          backgroundColor={COLORS.gunmetal}
        />
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={dynamicStyles.contentPadding}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
              progressBackgroundColor="#232F3E"
            />
          }
        >
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
          </View>
        </ScrollView>
      </SafeAreaView>
      <AIChatBox />
    </View>
  );
};

export default MovieDetails; 