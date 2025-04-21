import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, SafeAreaView, Image, TouchableOpacity, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchMovies } from '../store/movieSlice';
import AIChatBox from '../components/AIChatBox';
import { styles } from '../styles/MovieGallery.styles';
import { AppDispatch } from '../store';
import NavigationHeader from '../components/NavigationHeader';
import { COLORS } from '../styles/colors';

const MovieGallery = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { movies, searchResults, loading, error } = useSelector((state: RootState) => state.movies);
  const { chatboxHeight } = useSelector((state: RootState) => state.ai);
  const [filteredMovies, setFilteredMovies] = useState(movies);
  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const searchQuery = route.params?.searchQuery || '';
  const movieTitles = route.params?.movieTitles || [];
  const isFirstRender = React.useRef(true);
  const hasLoadedMovies = React.useRef(false);
  const isMounted = React.useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadMovies = useCallback(async () => {
    try {
      if (!hasLoadedMovies.current) {
        console.log('Loading movies for the first time');
      }

      if (movieTitles.length > 0) {
        console.log('Using accumulated search results for movie titles:', movieTitles);
      } else {
        console.log('Dispatching fetchMovies');
        await dispatch(fetchMovies()).unwrap();
      }
      
      hasLoadedMovies.current = true;
    } catch (error) {
      console.error('Error loading movies:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, movieTitles.length]);

  useEffect(() => {
    if (isFirstRender.current) {
      console.log('First render - loading movies');
      loadMovies();
      isFirstRender.current = false;
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRetryCount(0);
    loadMovies();
  }, [loadMovies]);

  useEffect(() => {
    if (retryCount > 0) {
      const timer = setTimeout(() => {
        console.log(`Retry attempt ${retryCount}`);
        loadMovies();
      }, 1500 * retryCount);
      
      return () => clearTimeout(timer);
    }
  }, [retryCount, loadMovies]);

  useEffect(() => {
    if (!isMounted.current) return;
    
    const sourceMovies = movieTitles.length > 0 ? searchResults : movies;
    if (sourceMovies.length === 0) {
      setFilteredMovies([]);
      return;
    }
    
    console.log(`Filtering ${sourceMovies.length} movies from source:`, 
      movieTitles.length > 0 ? 'searchResults' : 'all movies');
    
    let filtered = [];
    const requireExactMatch = route.params?.requireExactMatch || false;
    
    if (movieTitles && movieTitles.length > 0) {
      try {
        console.log('Filtering by movie titles:', movieTitles);
        const maxResults = route.params?.maxResults || 0;
        console.log('Exact matching required:', requireExactMatch, 'Max results:', maxResults);
        const safeTitles = movieTitles.map(title => 
          typeof title === 'string' ? title : String(title)
        );
        
        if (route.params?.movieYears && route.params.movieYears.length > 0) {
          console.log('Using year information for filtering:', route.params.movieYears);
          
          const movieInfoMap = {};
          for (let i = 0; i < safeTitles.length; i++) {
            try {
              const title = safeTitles[i];
              const year = route.params.movieYears[i];
              if (title) {
                movieInfoMap[title.toLowerCase()] = year;
              }
            } catch (err) {
              console.error('Error mapping movie title to year:', err);
            }
          }
          
          console.log('Movie-to-year mapping:', movieInfoMap);
          
          filtered = sourceMovies.filter(movie => {
            try {
              const movieTitle = movie.title.toLowerCase();
              const movieYear = movie.releaseDate ? movie.releaseDate.substring(0, 4) : null;
              
              console.log(`Evaluating movie: "${movie.title}" (${movieYear}) [ID: ${movie.id}]`);
              
              for (const title of safeTitles) {
                try {
                  const searchTitle = title.toLowerCase();
                  const searchYear = movieInfoMap[searchTitle];
                  
                  console.log(`Comparing to search: "${searchTitle}" (${searchYear || 'no year'})`);
                  
                  if (requireExactMatch) {
                    const exactTitleMatch = movieTitle === searchTitle;
                    if (searchYear && movieYear) {
                      const yearMatches = searchYear === movieYear;
                      if (exactTitleMatch && yearMatches) {
                        console.log(`STRONG MATCH: Exact title AND year match for "${movie.title}" (${movieYear})`);
                        return true;
                      }
                      if (exactTitleMatch && !yearMatches) {
                        console.log(`REJECTED: Title matches but year doesn't: ${movieYear} vs ${searchYear}`);
                        return false;
                      }
                    } 
                
                    else if (exactTitleMatch && !searchYear) {
                      console.log(`ACCEPTED: Exact title match with no year in search query for "${movie.title}"`);
                      return true;
                    }
                    
                    else if (exactTitleMatch && !movieYear) {
                     
                      if (searchYear) {
                        console.log(`REJECTED: Movie "${movie.title}" has no year info but search specified ${searchYear}`);
                        return false;
                      } else {
                        console.log(`ACCEPTED: Exact title match with no year info for "${movie.title}"`);
                        return true;
                      }
                    }
                  }
                  else {
                    const titleContains = movieTitle.includes(searchTitle) || searchTitle.includes(movieTitle);
                    
                    if (titleContains) {
                      if (searchYear && movieYear && searchYear === movieYear) {
                        console.log(`MATCH: Title contains and year matches for "${movie.title}" (${movieYear})`);
                        return true;
                      }
                      
                      else if (!searchYear || !movieYear) {
                        console.log(`MATCH: Title contains match with missing year for "${movie.title}"`);
                        return true;
                      }
                     
                      else {
                        console.log(`MATCH: Title match with mismatched years for "${movie.title}"`);
                        return true;
                      }
                    }
                  }
                } catch (titleErr) {
                  console.error('Error processing title in movie filter:', titleErr);
                }
              } 
              return false;
            } catch (movieErr) {
              console.error('Error evaluating movie in filter:', movieErr);
              return false;
            }
          }); 
        } 
     
        else {
         
          filtered = sourceMovies.filter(movie => {
            try {
              const movieTitle = movie.title.toLowerCase();
              
              for (const title of safeTitles) {
                try {
                  
                  const searchTitle = String(title).toLowerCase();
                  
                  if (requireExactMatch) {
                   
                    if (movieTitle === searchTitle) {
                      console.log(`EXACT MATCH: "${movie.title}" matches "${title}"`);
                      return true;
                    }
                  }
                  else {
                    
                    if (movieTitle.includes(searchTitle) || searchTitle.includes(movieTitle)) {
                      console.log(`FLEXIBLE MATCH: "${movie.title}" related to "${title}"`);
                      return true;
                    }
                  }
                } catch (titleErr) {
                  console.error('Error comparing movie title:', titleErr);
                }
              }
              return false;
            } catch (movieErr) {
              console.error('Error processing movie in title-only filter:', movieErr);
              return false;
            }
          });
        }
      } catch (filterErr) {
        console.error('Error in movie filtering:', filterErr);
        
        filtered = [...sourceMovies];
      }
      
      console.log(`Filtered to ${filtered.length} movies with requested criteria`);
      
      if (requireExactMatch && movieTitles.length === 1 && filtered.length === 1) {
        console.log('Single exact movie match, navigating directly to details');
        navigation.navigate('MovieDetails', { movieId: filtered[0].id, fromAI: true });
        return;
      }
      
      if (filtered.length === 0 && searchResults.length > 0) {
        console.log('No exact matches found, showing all search results as fallback');
        
        if (route.params.movieYears && route.params.movieYears.length > 0 && requireExactMatch) {
          console.log('Filtering fallback results by year');
          
          const yearFilteredResults = searchResults.filter(movie => {
            const movieYear = movie.releaseDate ? movie.releaseDate.substring(0, 4) : null;
            if (!movieYear) return false;
            
            for (let i = 0; i < movieTitles.length; i++) {
              const searchYear = route.params.movieYears[i];
              if (searchYear && movieYear === searchYear) {
                console.log(`FALLBACK YEAR MATCH: "${movie.title}" (${movieYear})`);
                return true;
              }
            }
            return false;
          });
          
          if (yearFilteredResults.length > 0) {
            console.log(`Found ${yearFilteredResults.length} fallback results with matching years`);
            filtered = yearFilteredResults;
          } else {
            console.log('No year matches in fallback, using all search results');
            filtered = searchResults;
          }
        } else {
          filtered = searchResults;
        }
      }
    } 
    else if (searchQuery) {
      filtered = sourceMovies.filter(movie => 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log(`Filtered to ${filtered.length} movies matching query: ${searchQuery}`);
    }
    
    filtered.sort((a, b) => {
      const aDate = a.releaseDate ? new Date(a.releaseDate) : new Date(0);
      const bDate = b.releaseDate ? new Date(b.releaseDate) : new Date(0);
      return bDate.getTime() - aDate.getTime(); 
    });
    
    setFilteredMovies(filtered);
  }, [movieTitles, searchQuery, movieTitles.length > 0 ? searchResults : movies, route.params, navigation]);

  const headerTitle = movieTitles.length > 0
    ? `Movie Results`
    : searchQuery
      ? `Movies: ${searchQuery}`
      : 'Movies';

  const renderMovieRows = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {movieTitles.length > 0 
              ? 'Finding your requested movies...' 
              : 'Loading movies...'}
          </Text>
        </View>
      );
    }

    if (filteredMovies.length === 0 && !loading) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {error 
              ? 'Try pulling down to refresh' 
              : movieTitles.length > 0 
                ? `Couldn't find the requested movies. Try a different query.`
                : 'No movies found'}
          </Text>
        </View>
      );
    }

    const rows = [];
    for (let i = 0; i < filteredMovies.length; i += 2) {
      const moviePair = [];
      
      moviePair.push(
        <TouchableOpacity
          key={filteredMovies[i].id}
          style={styles.card}
          onPress={() => navigation.navigate('MovieDetails', { movieId: filteredMovies[i].id, fromAI: true })}
        >
          <Image 
            source={{ uri: filteredMovies[i].poster }} 
            style={styles.cardImage} 
            resizeMode="cover"
          />
          <View style={styles.cardOverlay}>
            <View style={styles.overlayContent}>
              <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
                {filteredMovies[i].title}
              </Text>
              <View style={styles.infoContainer}>
                <Text style={styles.genreText}>
                  {filteredMovies[i].ageRating || 'PG'} | {filteredMovies[i].genres && filteredMovies[i].genres.length > 0 
                    ? filteredMovies[i].genres[0] 
                    : 'Adventure'}
                </Text>
                <Text style={styles.ratingText}>
                  {filteredMovies[i].rating.toFixed(1)}/10
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
      
      if (i + 1 < filteredMovies.length) {
        moviePair.push(
          <TouchableOpacity
            key={filteredMovies[i + 1].id}
            style={styles.card}
            onPress={() => navigation.navigate('MovieDetails', { movieId: filteredMovies[i + 1].id, fromAI: true })}
          >
            <Image 
              source={{ uri: filteredMovies[i + 1].poster }} 
              style={styles.cardImage} 
              resizeMode="cover"
            />
            <View style={styles.cardOverlay}>
              <View style={styles.overlayContent}>
                <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
                  {filteredMovies[i + 1].title}
                </Text>
                <View style={styles.infoContainer}>
                  <Text style={styles.genreText}>
                    {filteredMovies[i + 1].ageRating || 'PG'} | {filteredMovies[i + 1].genres && filteredMovies[i + 1].genres.length > 0 
                      ? filteredMovies[i + 1].genres[0] 
                      : 'Adventure'}
                  </Text>
                  <Text style={styles.ratingText}>
                    {filteredMovies[i + 1].rating.toFixed(1)}/10
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      }
      
      rows.push(
        <View key={`row-${i}`} style={styles.movieCardRow}>
          {moviePair}
        </View>
      );
    }
    
    return rows;
  };

  const dynamicStyles = StyleSheet.create({
    scrollViewContent: {
      ...styles.movieCardsContainer,
      paddingBottom: chatboxHeight > 0 ? chatboxHeight + 20 : 120, 
    }
  });

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        <NavigationHeader 
          title={headerTitle} 
          backgroundColor={COLORS.gunmetal}
        />
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error}
              {retryCount > 0 && ' (Retrying...)'}
            </Text>
          </View>
        )}
        
        <ScrollView 
          contentContainerStyle={dynamicStyles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
              progressBackgroundColor="#232F3E"
            />
          }
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {renderMovieRows()}
        </ScrollView>
      </SafeAreaView>
      <AIChatBox />
    </View>
  );
};

export default MovieGallery; 