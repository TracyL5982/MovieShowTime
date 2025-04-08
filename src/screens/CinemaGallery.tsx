import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchCinemas } from '../store/cinemaSlice';
import AIChatBox from '../components/AIChatBox';
import { styles } from '../styles/CinemaGallery.styles';
import { AppDispatch } from '../store';
import { Ionicons } from '@expo/vector-icons';

const CinemaGallery = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { cinemas, loading, error } = useSelector((state: RootState) => state.cinemas);
  const [filteredCinemas, setFilteredCinemas] = useState(cinemas);

  useEffect(() => {
    dispatch(fetchCinemas(10));
  }, [dispatch]);

  useEffect(() => {
    setFilteredCinemas(cinemas);
  }, [cinemas]);

  const renderCinemaItems = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading cinemas...</Text>
        </View>
      );
    }

    if (filteredCinemas.length === 0 && !loading) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No cinemas found</Text>
        </View>
      );
    }

    return filteredCinemas.map((cinema) => (
      <TouchableOpacity
        key={cinema.id}
        style={styles.cinemaCard}
        onPress={() => navigation.navigate('CinemaDetails', { cinemaId: cinema.id })}
      >
        <View style={styles.cinemaInfoContainer}>
          <View style={styles.cinemaNameContainer}>
            <Text style={styles.cinemaName}>{cinema.name}</Text>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.cinemaAddress}>{cinema.address}, {cinema.city}</Text>
          <View style={styles.distanceContainer}>
            <Ionicons name="location" size={14} color="#FEBD69" />
            <Text style={styles.distanceText}>{cinema.distance.toFixed(1)} miles away</Text>
          </View>
        </View>
      </TouchableOpacity>
    ));
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Cinemas Near You</Text>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <ScrollView contentContainerStyle={styles.cinemaListContainer}>
          {renderCinemaItems()}
        </ScrollView>
      </SafeAreaView>
      <AIChatBox />
    </View>
  );
};

export default CinemaGallery; 