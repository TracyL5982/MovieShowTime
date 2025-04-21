import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/MovieShowtime.styles';
import AIChatBox from '../components/AIChatBox';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { MovieShowtimeAPI, ShowtimeDetails } from '../services';
import NavigationHeader from '../components/NavigationHeader';
import { COLORS } from '../styles/colors';


interface Showtime extends ShowtimeDetails {}

const MovieShowtime = ({ navigation, route }) => {
  const { 
    movieId, 
    movieTitle,
    title,
    poster, 
    cinemaId, 
    cinemaName, 
    date,
    fromCinemaDetails, 
    fromAI 
  } = route.params || {};
  
  const movieName = movieTitle || title || null;

  const parseISODate = (iso: string) => {
    const [Y, M, D] = iso.split('-').map(Number);
    return new Date(Y, M - 1, D);
  };

  const initialDate = date
    ? parseISODate(date)
    : new Date();
  
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(movieName || null);
  const [selectedCinema, setSelectedCinema] = useState(cinemaName || null);
  const [noShowtimesMessage, setNoShowtimesMessage] = useState<string | null>(null);
  
  const screenTitle = fromCinemaDetails && cinemaName ? 
    `Showtimes at ${cinemaName}` : 
    `Showtimes for ${selectedMovie || 'Movie'}`;
  
  useEffect(() => {
    console.log('MovieShowtime params:', { 
      movieId, movieTitle, title, cinemaId, cinemaName, date, fromCinemaDetails 
    });
  }, [movieId, movieTitle, title, cinemaId, cinemaName, date, fromCinemaDetails]);
  
  const { movies } = useSelector((state: RootState) => state.movies);
  const { chatboxHeight } = useSelector((state: RootState) => state.ai);

  const dispatch = useDispatch<AppDispatch>();

  
  const formatDateName = (date) => {
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'TODAY';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    }
  };

  const formatDateValue = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  
  const loadShowtimes = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoShowtimesMessage(null);
    
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const targetMovieId = movieId || (selectedMovie ? 
        movies.find(m => m.title === selectedMovie)?.id : null);
      let apiShowtimes: ShowtimeDetails[] = [];
      if (movieName) {
        console.log('Getting AI showtimes for movie:', movieName, 'date:', dateString);

        try {
          console.log('Calling MovieShowtimeAPI.getAIShowtimesForMovie...');
          const aiShowtimesResult = await MovieShowtimeAPI.getAIShowtimesForMovie(movieName, dateString);
          console.log('AI Showtimes API call completed with response:', JSON.stringify(aiShowtimesResult).substring(0, 200) + '...');
          
          if (aiShowtimesResult.noShowtimesAvailable) {
            console.log('No showtimes available for this movie from AI');
            console.log('Message:', aiShowtimesResult.noShowtimesMessage);
            setNoShowtimesMessage(aiShowtimesResult.noShowtimesMessage || 'No showtimes available for this movie');
            setShowtimes([]);
            setLoading(false);
            return;
          }
          
          console.log(`Found ${aiShowtimesResult.showtimes.length} showtimes for ${movieName} from AI search`);
          
          if (aiShowtimesResult.showtimes.length > 0) {
            const firstShowtime = aiShowtimesResult.showtimes[0];
            console.log('Sample showtime:', JSON.stringify(firstShowtime));
          }
          
          apiShowtimes = aiShowtimesResult.showtimes;
        } catch (aiError) {
          console.error('Error in AI showtime search:', aiError);
          throw new Error('Failed to get showtimes from AI: ' + aiError.message);
        }
      }
      else if (targetMovieId) {
        console.log('Getting showtimes for movie ID:', targetMovieId);
        apiShowtimes = await MovieShowtimeAPI.getShowtimesForMovie(targetMovieId);
      } 
      
      else if (cinemaId) {
        console.log('Getting showtimes for cinema:', cinemaId);
        const showtimesByMovie = await MovieShowtimeAPI.getMoviesAtCinema(cinemaId);
        
        
        const allMovies = await MovieShowtimeAPI.getMovies();
        
        
        for (const [movieId, showtimes] of Object.entries(showtimesByMovie)) {
          const movie = allMovies.find(m => m.id === movieId);
          
          
          const processed = showtimes.map(s => ({
            id: s.id,
            movieId: s.movieId,
            movieTitle: movie?.title || 'Unknown Movie',
            theater: s.theater,
            theaterId: s.cinemaId,
            date: s.date,
            time: s.time,
            price: s.price,
            format: s.format
          }));
          
          apiShowtimes = [...apiShowtimes, ...processed];
        }
      } 
      else {
        console.log('Getting showtimes for popular movies');
        const movies = await MovieShowtimeAPI.getMovies();
        if (movies.length > 0) {
          const popularMovieId = movies[0]?.id;
          if (popularMovieId) {
            apiShowtimes = await MovieShowtimeAPI.getShowtimesForMovie(popularMovieId);
          }
        }
      }
      
      console.log(`Total showtimes found before filtering: ${apiShowtimes.length}`);
      
      let filteredShowtimes = apiShowtimes.filter(
        showtime => showtime.date === dateString
      );
      
      console.log(`Showtimes after date filtering (${dateString}): ${filteredShowtimes.length}`);
      
      if (movieName && !movieId) {
        filteredShowtimes = filteredShowtimes.filter(
          showtime => showtime.movieTitle === movieName
        );
        console.log(`Showtimes after title filtering (${movieName}): ${filteredShowtimes.length}`);
      }
      
      
      if (selectedCinema) {
        filteredShowtimes = filteredShowtimes.filter(
          showtime => showtime.theater === selectedCinema
        );
        console.log(`Showtimes after cinema filtering (${selectedCinema}): ${filteredShowtimes.length}`);
      }
      
      setShowtimes(filteredShowtimes);
      
      if (filteredShowtimes.length === 0) {
        console.log('No showtimes found after filtering');
        setNoShowtimesMessage('No showtimes found for this movie on the selected date.');
      } else {
        console.log(`Successfully found ${filteredShowtimes.length} showtimes after all filtering`);
      }
    } catch (error) {
      console.error('Error loading showtimes:', error);
      setError('Failed to load showtimes. Please try again: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedMovie, selectedCinema, movieId, movieName, movies, cinemaId]);

  useEffect(() => {
    setLoading(true);
    
    const loadInitialShowtimes = async () => {
      try {
        await loadShowtimes();
      } finally {
        previousDateRef.current = selectedDate.toISOString().split('T')[0];
      }
    };

    loadInitialShowtimes();
    
  }, []);

  const isUserDateChange = useRef(false);
  const previousDateRef = useRef(initialDate.toISOString().split('T')[0]);
  
  const navigateDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    isUserDateChange.current = true; 
    setSelectedDate(newDate);
  };

  
  const renderDates = () => {
    const dates = [];
    for (let i = -1; i <= 1; i++) {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() + i);
      
      const isSelected = i === 0;
      
      dates.push(
        <TouchableOpacity 
          key={i} 
          style={styles.dateItem}
          onPress={() => navigateDate(i)}
        >
          <View style={styles.dateTextContainer}>
            <Text style={styles.dateName}>{formatDateName(date)}</Text>
            <Text style={styles.dateValue}>{formatDateValue(date)}</Text>
          </View>
          <View style={isSelected ? styles.activeDateIndicator : styles.inactiveDateIndicator} />
        </TouchableOpacity>
      );
    }
    return dates;
  };

  
  const calculateEndTime = (startTime) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes);
    
    
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2);
    
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  const dynamicStyles = StyleSheet.create({
    contentPadding: {
      paddingBottom: chatboxHeight > 0 ? chatboxHeight + 20 : 160, 
    }
  });

  useEffect(() => {
    if (route.params?.date) {
      isUserDateChange.current = false; 
      setSelectedDate(parseISODate(route.params.date));
    }
  }, [route.params?.date]);
  
  useEffect(() => {
    const currentDateString = selectedDate.toISOString().split('T')[0];
  
    if (!loading && 
        (isUserDateChange.current || currentDateString !== previousDateRef.current)) {
      
      console.log('Date changed by user, refreshing showtimes for:', currentDateString);
      
      isUserDateChange.current = false;
      
      previousDateRef.current = currentDateString;
      
      loadShowtimes();
    }
  }, [selectedDate, loadShowtimes, loading]);

  useEffect(() => {
    if (movieName && selectedMovie !== movieName) {
      console.log('Setting movie title in filter from route params:', movieName);
      setSelectedMovie(movieName);
    }
  }, [movieName, selectedMovie]);

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <NavigationHeader 
          title={screenTitle} 
          backgroundColor={COLORS.gunmetal}
        />
        
        <ScrollView
          contentContainerStyle={[styles.contentContainer, dynamicStyles.contentPadding]}
          showsVerticalScrollIndicator={false}
        >
          {/* Date Selector */}
          <View style={styles.dateSelector}>
            <TouchableOpacity onPress={() => navigateDate(-3)}>
              <Ionicons name="chevron-back" size={24} color="#8A8A8E" />
            </TouchableOpacity>
            
            {renderDates()}
            
            <TouchableOpacity onPress={() => navigateDate(3)}>
              <Ionicons name="chevron-forward" size={24} color="#8A8A8E" />
            </TouchableOpacity>
          </View>
          
          {/* Filter Options */}
          <View style={styles.filterContainer}>
            <TouchableOpacity style={styles.filterButton}>
              <View style={styles.filterButtonContent}>
                <Ionicons name="film-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text 
                  style={styles.filterText}
                  numberOfLines={1} 
                  ellipsizeMode="tail"
                >
                  {selectedMovie || "MOVIE(S)"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.filterButton}>
              <View style={styles.filterButtonContent}>
                <Ionicons name="location-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text 
                  style={styles.filterText} 
                  numberOfLines={1} 
                  ellipsizeMode="tail"
                >
                  {selectedCinema || "CINEMA(S)"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Showtimes List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FEBD69" />
              <Text style={styles.loadingText}>Loading showtimes...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : showtimes && showtimes.length > 0 ? (
            <View style={styles.showtimesContainer}>
              {showtimes.map((showtime, index) => {
                const endTime = showtime.endTime || calculateEndTime(showtime.time);
                
                const formattedPrice = showtime.price 
                  ? (showtime.price.startsWith('$') ? showtime.price : `$${showtime.price}`)
                  : '$12.99';

                const isPlaceholder = showtime.time === "No showtimes available" || showtime.time === "Call theater";
                
                return (
                  <TouchableOpacity 
                    key={showtime.id || index}
                    style={[styles.showtimeCard, isPlaceholder && styles.placeholderCard]}
                    onPress={() => {
                      if (!isPlaceholder) {
                        console.log('Selected showtime:', showtime);
                        alert(`Selected showtime for ${showtime.movieTitle} at ${showtime.time}`);
                      } else {
                        alert('No showtimes available for this movie at this date. Please check the theater website directly.');
                      }
                    }}
                  >
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>{showtime.time}</Text>
                      {!isPlaceholder && endTime && (
                        <Text style={styles.endTimeText}>Ends {endTime}</Text>
                      )}
                    </View>
                    
                    <View style={styles.priceFormatContainer}>
                      <Text style={styles.priceText}>
                        {isPlaceholder ? 'Check theater' : formattedPrice}
                      </Text>
                      {!isPlaceholder && showtime.format && showtime.format !== 'Standard' && showtime.format !== 'N/A' && (
                        <View style={styles.formatTag}>
                          <Text style={styles.formatText}>{showtime.format}</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.theaterInfoContainer}>
                      <Text style={styles.theaterName} numberOfLines={1} ellipsizeMode="tail">
                        {showtime.theater || 'Movie Theater'}
                      </Text>
                      {!isPlaceholder && (
                        <View style={styles.distanceContainer}>
                          <Ionicons name="location" size={10} color="#FEBD69" style={{ marginRight: 2 }} />
                          <Text style={styles.distanceText}>
                            {showtime.cinemaDistance || showtime.distance || '2-5 miles'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.noShowtimesContainer}>
              <Text style={styles.noShowtimesText}>{noShowtimesMessage || 'No showtimes available for this date'}</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <AIChatBox />
    </View>
  );
};

export default MovieShowtime; 