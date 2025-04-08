import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/MovieShowtime.styles';
import AIChatBox from '../components/AIChatBox';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { MovieShowtimeAPI, ShowtimeDetails } from '../services';

interface Showtime extends ShowtimeDetails {}

const MovieShowtime = ({ navigation, route }) => {
  const { movieId, movieTitle, poster, cinemaId, cinemaName } = route.params || {};
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(movieTitle || null);
  const [selectedCinema, setSelectedCinema] = useState(cinemaName || null);
  
  const { movies } = useSelector((state: RootState) => state.movies);

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
    
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      const targetMovieId = movieId || (selectedMovie ? 
        movies.find(m => m.title === selectedMovie)?.id : null);
      
      let apiShowtimes: ShowtimeDetails[] = [];
      
      if (targetMovieId) {
        apiShowtimes = await MovieShowtimeAPI.getShowtimesForMovie(targetMovieId);
      } else if (cinemaId) {
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
            format: s.format,
            distance: '2.5 miles' 
          }));
          
          apiShowtimes = [...apiShowtimes, ...processed];
        }
      } else {
        const movies = await MovieShowtimeAPI.getMovies();
        const popularMovieId = movies[0]?.id || '234489'; 
        apiShowtimes = await MovieShowtimeAPI.getShowtimesForMovie(popularMovieId);
      }
      
      let filteredShowtimes = apiShowtimes.filter(
        showtime => showtime.date === dateString
      );
      
      if (movieTitle && !movieId) {
        filteredShowtimes = filteredShowtimes.filter(
          showtime => showtime.movieTitle === movieTitle
        );
      }
      
      if (selectedCinema) {
        filteredShowtimes = filteredShowtimes.filter(
          showtime => showtime.theater === selectedCinema
        );
      }
      
      setShowtimes(filteredShowtimes);
      
      if (filteredShowtimes.length === 0 && movieTitle) {
        const dummyShowtimes = generateDummyShowtimes(movieTitle, dateString);
        setShowtimes(dummyShowtimes);
      }
    } catch (error) {
      console.error('Error loading showtimes:', error);
      setError('Failed to load showtimes. Please try again.');
      
      if (movieTitle) {
        const dummyShowtimes = generateDummyShowtimes(movieTitle, selectedDate.toISOString().split('T')[0]);
        setShowtimes(dummyShowtimes);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedMovie, selectedCinema, movieId, movieTitle, movies, cinemaId]);

  const generateDummyShowtimes = (title, dateString) => {
    const theaters = [
      'AMC Theaters Downtown',
      'Regal Cinemas Westfield',
      'Cinemark Theaters Eastgate',
      'Alamo Drafthouse Cinema'
    ];
    
    const times = ['10:00', '12:30', '15:00', '17:30', '20:00', '22:30'];
    
    const dummyShowtimes = [];
    
    theaters.forEach(theater => {
      const numTimes = Math.floor(Math.random() * 2) + 2;
      const theaterTimes = [...times].sort(() => 0.5 - Math.random()).slice(0, numTimes);
      
      theaterTimes.forEach(time => {
        dummyShowtimes.push({
          id: `dummy-${Date.now()}-${Math.random()}`,
          movieId: movieId || `dummy-${Date.now()}`,
          movieTitle: title,
          theater: theater,
          theaterId: `theater-${theater.replace(/\s+/g, '-').toLowerCase()}`,
          date: dateString,
          time: time,
          price: '$12.99',
          distance: `${(Math.random() * 10).toFixed(1)} miles`
        });
      });
    });
    
    return dummyShowtimes;
  };

  useEffect(() => {
    loadShowtimes();
  }, [loadShowtimes]);

  const navigateDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
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

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#F7F9FA" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Movie Showtimes</Text>
        </View>
        
        <ScrollView
          contentContainerStyle={styles.contentContainer}
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
                <Text style={styles.filterText}>{selectedMovie || "MOVIE(S)"}</Text>
                <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.filterButton}>
              <View style={styles.filterButtonContent}>
                <Ionicons name="location-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.filterText} numberOfLines={1} ellipsizeMode="tail">{selectedCinema || "CINEMA(S)"}</Text>
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
                const endTime = calculateEndTime(showtime.time);
                
                // Ensure price has a dollar sign
                const formattedPrice = showtime.price.startsWith('$') ? 
                  showtime.price : 
                  `$${showtime.price}`;

                return (
                  <TouchableOpacity 
                    key={showtime.id || index}
                    style={styles.showtimeCard}
                    onPress={() => {
                      // Show toast or alert instead of navigating
                      console.log('Selected showtime:', showtime);
                      // You could implement a toast or alert here
                      alert(`Selected showtime for ${showtime.movieTitle} at ${showtime.time}`);
                    }}
                  >
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>{showtime.time}</Text>
                      <Text style={styles.endTimeText}>Ends {endTime}</Text>
                    </View>
                    
                    <View style={styles.priceFormatContainer}>
                      <Text style={styles.priceText}>{formattedPrice}</Text>
                      {showtime.format && showtime.format !== 'Standard' && (
                        <View style={styles.formatTag}>
                          <Text style={styles.formatText}>{showtime.format}</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.theaterInfoContainer}>
                      <Text style={styles.theaterName} numberOfLines={1} ellipsizeMode="tail">{showtime.theater || 'Movie Theater Name'}</Text>
                      <View style={styles.distanceContainer}>
                        <Ionicons name="location" size={10} color="#FEBD69" style={{ marginRight: 2 }} />
                        <Text style={styles.distanceText}>{showtime.distance || 'Distance'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.noShowtimesContainer}>
              <Text style={styles.noShowtimesText}>No showtimes available for this date</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <AIChatBox />
    </View>
  );
};

export default MovieShowtime; 