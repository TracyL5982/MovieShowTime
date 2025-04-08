import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, SafeAreaView, Image, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchMovies } from '../store/movieSlice';
import AIChatBox from '../components/AIChatBox';
import CustomSearchBar from '../components/CustomSearchBar';
import { styles } from '../styles/MovieGallery.styles';
import { AppDispatch } from '../store';
import { Ionicons } from '@expo/vector-icons';

const MovieGallery = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { movies, loading, error } = useSelector((state: RootState) => state.movies);
  const [filteredMovies, setFilteredMovies] = useState(movies);
  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const loadMovies = useCallback(async () => {
    try {
      await dispatch(fetchMovies()).unwrap();
    } catch (error) {
      console.error('Error loading movies:', error);
      if (retryCount < 2) {
        setTimeout(() => {
          setRetryCount(prevCount => prevCount + 1);
          loadMovies();
        }, 1500 * (retryCount + 1)); 
      }
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, retryCount]);

  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRetryCount(0); 
    loadMovies();
  }, [loadMovies]);

  useEffect(() => {
    setFilteredMovies(movies);
  }, [movies]);

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Movies</Text>
      </View>
    );
  };

  const renderMovieRows = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading movies...</Text>
        </View>
      );
    }

    if (filteredMovies.length === 0 && !loading) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {error ? 'Try pulling down to refresh' : 'No movies found'}
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
          onPress={() => navigation.navigate('MovieDetails', { movieId: filteredMovies[i].id })}
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
            onPress={() => navigation.navigate('MovieDetails', { movieId: filteredMovies[i + 1].id })}
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

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error}
              {retryCount > 0 && ' (Retrying...)'}
            </Text>
          </View>
        )}
        
        <ScrollView 
          contentContainerStyle={styles.movieCardsContainer}
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