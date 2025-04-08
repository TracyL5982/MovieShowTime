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
  Platform 
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchCinema } from '../store/cinemaSlice';
import { AppDispatch } from '../store';
import { Ionicons } from '@expo/vector-icons';
import AIChatBox from '../components/AIChatBox';
import { fetchCinemaShowtimes } from '../services/movieglu';
import { styles } from '../styles/CinemaDetails.styles';

const CinemaDetails = ({ route, navigation }) => {
  const { cinemaId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { selectedCinema, loading, error } = useSelector((state: RootState) => state.cinemas);
  const { movies } = useSelector((state: RootState) => state.movies);
  const [showtimes, setShowtimes] = useState(null);
  const [showTimesLoading, setShowTimesLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    dispatch(fetchCinema(cinemaId));
  }, [dispatch, cinemaId]);

  useEffect(() => {
    const fetchShowtimesData = async () => {
      if (selectedCinema) {
        setShowTimesLoading(true);
        try {
          const dateString = selectedDate.toISOString().split('T')[0];
          const data = await fetchCinemaShowtimes(cinemaId, dateString);
          setShowtimes(data);
        } catch (error) {
          console.error('Error fetching showtimes:', error);
        } finally {
          setShowTimesLoading(false);
        }
      }
    };

    fetchShowtimesData();
  }, [cinemaId, selectedCinema, selectedDate]);

  const handleDateSelect = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getDirectionsUrl = () => {
    if (!selectedCinema) return '';
    
    const { location } = selectedCinema;
    const destination = `${location.lat},${location.lng}`;
    
    if (Platform.OS === 'ios') {
      return `http://maps.apple.com/?daddr=${destination}`;
    } else {
      return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    }
  };

  const openDirections = () => {
    const url = getDirectionsUrl();
    Linking.openURL(url);
  };

  const goToShowtimes = () => {
    navigation.navigate('MovieShowtime', {
      cinemaId: cinemaId,
      cinemaName: selectedCinema?.name
    });
  };

  const getFallbackMoviePosters = () => {
    return [
      {
        id: '1001',
        title: 'Inception',
        poster: 'https://via.placeholder.com/40x40?text=Inception'
      },
      {
        id: '1002',
        title: 'The Dark Knight',
        poster: 'https://via.placeholder.com/40x40?text=Dark+Knight'
      },
      {
        id: '1003',
        title: 'Interstellar',
        poster: 'https://via.placeholder.com/40x40?text=Interstellar'
      },
      {
        id: '1004',
        title: 'Dune',
        poster: 'https://via.placeholder.com/40x40?text=Dune'
      },
      {
        id: '1005',
        title: 'Oppenheimer',
        poster: 'https://via.placeholder.com/40x40?text=Oppenheimer'
      },
      {
        id: '1006',
        title: 'Barbie',
        poster: 'https://via.placeholder.com/40x40?text=Barbie'
      }
    ];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FEBD69" />
        <Text style={styles.loadingText}>Loading cinema details...</Text>
      </View>
    );
  }

  if (error) {
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

  if (!selectedCinema) {
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
          <Text style={styles.headerTitle}>Cinema Details</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Cinema Image */}
          <View style={styles.cinemaImageContainer}>
            <Image 
              source={{ uri: 'https://via.placeholder.com/361x328?text=Cinema+Image' }}
              style={styles.cinemaImage}
              resizeMode="cover"
            />
          </View>

          {/* Cinema Info */}
          <View style={styles.cinemaInfoContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.cinemaName}>{selectedCinema.name}</Text>
              <View style={styles.distanceContainer}>
                <Ionicons name="location" size={16} color="#FEBD69" style={{ marginRight: 5 }} />
                <Text style={styles.distanceText}>{selectedCinema.distance?.toFixed(1) || '2.5'} miles</Text>
              </View>
            </View>
            <Text style={styles.addressText}>{selectedCinema.address}, {selectedCinema.city}, {selectedCinema.state} {selectedCinema.postalCode}</Text>
          </View>

          {/* Movies On Show */}
          <View style={styles.moviesContainer}>
            <Text style={styles.moviesTitle}>Movies On Show:</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.posterScroll}
            >
              {(movies.length > 0 ? movies.slice(0, 6) : getFallbackMoviePosters()).map((movie, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.posterContainer}
                  onPress={() => navigation.navigate('MovieDetails', { movieId: movie.id })}
                >
                  <Image 
                    source={{ uri: movie.poster }} 
                    style={styles.posterImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
              <View style={styles.nextArrowContainer}>
                <Ionicons name="chevron-forward" size={24} color="#8A8A8E" />
              </View>
            </ScrollView>

            {/* View Show Times Button */}
            <TouchableOpacity 
              style={styles.showTimesButton}
              onPress={goToShowtimes}
            >
              <Text style={styles.showTimesButtonText}>View Show Times</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
      <AIChatBox />
    </View>
  );
};

export default CinemaDetails; 