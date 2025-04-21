import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, StyleSheet, FlatList, Alert, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import AIChatBox from '../components/AIChatBox';
import { styles } from '../styles/CinemaGallery.styles';
import { AppDispatch } from '../store';
import { Ionicons } from '@expo/vector-icons';
import { Cinema } from '../services';
import { StructuredCinemaResponse } from '../store/aiSlice';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationHeader from '../components/NavigationHeader';
import { COLORS } from '../styles/colors';

interface ExtendedCinema extends Cinema {
  isFromAI?: boolean;
  description?: string; 
  placeholder?: boolean; 
  url?: string; 
}

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 3958.8; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};

const CinemaGallery = ({ navigation, route }) => {
  const { aiResponse, searchCinemas = [], searchQuery, fromAI = false } = route.params || {};
  const [aiCinemas, setAiCinemas] = useState<ExtendedCinema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { chatboxHeight } = useSelector((state: RootState) => state.ai);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const structuredCinemaData = useSelector((state: RootState) => state.ai.structuredCinemaData);
  const initializedRef = useRef(false);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        console.log('Location permission granted, getting current position');
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        const userLoc = {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        };
        setUserLocation(userLoc);
        console.log('User location obtained:', userLoc);
        
        await AsyncStorage.setItem('hasAskedLocationPermission', 'true');
        return true;
      } else {
        console.log('Location permission denied');
        setLocationPermissionDenied(true);
        
        await AsyncStorage.setItem('hasAskedLocationPermission', 'true');
        return false;
      }
    } catch (error) {
      console.error('Error getting location permission:', error);
      setLocationPermissionDenied(true);
      
      await AsyncStorage.setItem('hasAskedLocationPermission', 'true');
      return false;
    }
  }, []);

  useEffect(() => {
    const checkExistingPermissions = async () => {
      try {
        const hasAskedPermission = await AsyncStorage.getItem('hasAskedLocationPermission');

        const { status } = await Location.getForegroundPermissionsAsync();
        console.log('Current location permission status:', status);
        
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
          });
          
          const userLoc = {
            lat: location.coords.latitude,
            lng: location.coords.longitude
          };
          
          console.log('Retrieved current location on mount:', userLoc);
          setUserLocation(userLoc);
          
          await AsyncStorage.setItem('hasAskedLocationPermission', 'true');
        } else if (status === 'denied') {
          console.log('Location permission was previously denied');
          setLocationPermissionDenied(true);
          await AsyncStorage.setItem('hasAskedLocationPermission', 'true');
        } else if (hasAskedPermission !== 'true') {
          console.log('Location permission is undetermined, will prompt user');
        } else {
          console.log('Already asked for location permission before');
          setLocationPermissionDenied(true);
        }
      } catch (error) {
        console.error('Error checking location permissions:', error);
      }
    };
    
    checkExistingPermissions();
  }, []);

  // request location permission on mount 
  useEffect(() => {

    const checkAndAskForPermission = async () => {
      if (userLocation === null && !locationPermissionDenied) {
        const hasAskedPermission = await AsyncStorage.getItem('hasAskedLocationPermission');
        
        if (hasAskedPermission !== 'true') {
          askForLocationPermission();
        } else {
          console.log('Already asked for location permission, not showing dialog again');
          setLocationPermissionDenied(true);
        }
      }
    };
    
    checkAndAskForPermission();
  }, [userLocation, locationPermissionDenied]);
  
  const askForLocationPermission = async () => {
    Alert.alert(
      "Location Permission",
      "We need your location to calculate accurate distances to cinemas near you. Without your location, we can only show estimated distances.",
      [
        {
          text: "Don't Allow",
          onPress: async () => {
            console.log("Location permission denied by user");
            setLocationPermissionDenied(true);
            await AsyncStorage.setItem('hasAskedLocationPermission', 'true');
            
            Alert.alert(
              "Location Access Denied",
              "Distances to cinemas will be estimated and may not be accurate. You can change location permissions in your device settings later.",
              [{ text: "OK" }]
            );
          },
          style: "cancel"
        },
        { 
          text: "Allow", 
          onPress: async () => {
            const granted = await requestLocationPermission();
            await AsyncStorage.setItem('hasAskedLocationPermission', 'true');
            
            if (!granted) {
              Alert.alert(
                "Location Unavailable",
                "We couldn't access your location. Distances to cinemas will be estimated. You can change location settings in your device settings.",
                [{ text: "OK" }]
              );
            }
          }
        }
      ],
      { cancelable: false }
    );
  };

  const createPlaceholderCinema = useCallback((
    name: string, 
    address: string | null = null, 
    description: string = '', 
    url: string = ''
  ): ExtendedCinema => {
    const cinemaId = `ai-cinema-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    return {
      id: cinemaId,
      name: name,
      description: description || '',
      address: address || '',
      city: '',
      state: '',
      postalCode: '',
      location: null,
      distance: null, 
      logo: null,
      url: url || '',
      isFromAI: true
    };
  }, []);

  const updateCinemaDistances = useCallback((cinemas: ExtendedCinema[]) => {
    if (!userLocation) return cinemas;
    
    console.log('Updating distances for', cinemas.length, 'cinemas with user location:', userLocation);
    
    return cinemas.map(cinema => {
      if (cinema.distance !== null) {
        return cinema;
      }
      
      let cinemaLocation = cinema.location;
      
      if (!cinemaLocation) {

        console.log(`Estimating location for "${cinema.name}"`);
        const randomOffset = () => (Math.random() - 0.5) * 0.1; 
        
        cinemaLocation = {
          lat: userLocation.lat + randomOffset(),
          lng: userLocation.lng + randomOffset()
        };
      }
      
      if (!cinemaLocation || !cinemaLocation.lat || !cinemaLocation.lng) {
        console.log(`Cinema "${cinema.name}" has incomplete location data`);
        return cinema;
      }
      
      const distance = calculateDistance(
        userLocation.lat, userLocation.lng,
        cinemaLocation.lat, cinemaLocation.lng
      );
      
      if (distance !== null) {
        console.log(`Calculated distance to "${cinema.name}": ${distance.toFixed(2)} miles`);
        return {
          ...cinema,
          location: cinemaLocation,
          distance: distance
        };
      }
      
      return cinema;
    });
  }, [userLocation]);
  
  const processAICinemas = useCallback(() => {
    if (searchCinemas.length === 0) return [];
    console.log('Raw searchCinemas data (first 3 items):', searchCinemas.slice(0, 3));
    const cinemaObjects = [];
    const fullText = Array.isArray(searchCinemas) ? searchCinemas.join('\n') : searchCinemas.toString();
    
    console.log('FULL TEXT (first 300 chars):', fullText.substring(0, 300));
    const bracketPattern = /\[(.*?)\]/g;
    const bracketMatches = Array.from(fullText.matchAll(bracketPattern));
    
    console.log(`Found ${bracketMatches.length} cinema names in square brackets`);
    bracketMatches.forEach((match, index) => {
      const cinemaName = match[1].trim();
      console.log(`Cinema name ${index} from brackets: "${cinemaName}"`);

      if (!cinemaName || cinemaName.toLowerCase().includes('here are')) {
        return;
      }

      if (!cinemaObjects.some(c => c.name.toLowerCase() === cinemaName.toLowerCase())) {
        cinemaObjects.push({
          name: cinemaName,
          address: ''
        });
        console.log(`Added cinema: "${cinemaName}"`);
      }
    });
    
    console.log(`Found ${cinemaObjects.length} cinemas in total:`, cinemaObjects);

    const aiGeneratedCinemas = cinemaObjects.map(cinema => 
      createPlaceholderCinema(cinema.name, cinema.address)
    );
    
    console.log(`Created ${aiGeneratedCinemas.length} placeholder cinemas from AI`);
    return aiGeneratedCinemas;
  }, [searchCinemas, createPlaceholderCinema]);

  const extractCinemaNamesFromJsonResponse = useCallback((responseJson: any): string[] => {
    const cinemaNames: string[] = [];
    const processedNames = new Set<string>();
    
    try {
      
      // 1. Check output array
      if (responseJson.output && Array.isArray(responseJson.output)) {
        responseJson.output.forEach(item => {
          if (item.type === 'message' && item.content && Array.isArray(item.content)) {
            item.content.forEach(content => {
              if (content.annotations && Array.isArray(content.annotations)) {
                content.annotations.forEach(annotation => {
                  if (annotation.type === 'url_citation' && annotation.title) {
                    const name = annotation.title.trim();
                    if (!processedNames.has(name.toLowerCase())) {
                      cinemaNames.push(name);
                      processedNames.add(name.toLowerCase());
                      console.log(`Extracted cinema name from output annotation: "${name}"`);
                    }
                  }
                });
              }
            });
          }
        });
      }
      
      // 2. Check items array
      if (responseJson.items && Array.isArray(responseJson.items)) {
        responseJson.items.forEach(item => {
          if (item.type === 'message' && item.content && Array.isArray(item.content)) {
            item.content.forEach(content => {
              if (content.annotations && Array.isArray(content.annotations)) {
                content.annotations.forEach(annotation => {
                  if (annotation.type === 'url_citation' && annotation.title) {
                    const name = annotation.title.trim();
                    if (!processedNames.has(name.toLowerCase())) {
                      cinemaNames.push(name);
                      processedNames.add(name.toLowerCase());
                      console.log(`Extracted cinema name from items annotation: "${name}"`);
                    }
                  }
                });
              }
            });
          }
        });
      }
      
      // Filter out non-cinema titles
      const filteredNames = cinemaNames.filter(name => 
        name.length > 3 && 
        !name.toLowerCase().includes('google') &&
        !name.toLowerCase().includes('search') &&
        !name.toLowerCase().includes('map')
      );
      
      return filteredNames;
    } catch (error) {
      console.error('Error extracting cinema names from JSON:', error);
      return [];
    }
  }, []);
  
  const extractCinemaDetailsFromResponseText = useCallback((text: string): {
    name: string;
    description: string;
    address?: string;  
    url?: string;      
  }[] => {
    if (!text) return [];
    
    const cinemaDetails: {
      name: string;
      description: string;
      address?: string;
      url?: string;
    }[] = [];
    const processedNames = new Set<string>();
    
    try {
      const cinemaBlockRegex = /\*\*\[(.*?)\](?:\([^)]*\))\*\*\n_[^_]+_\n(.*?)(?=\n\n\*\*\[|$)/gs;
      const matches = Array.from(text.matchAll(cinemaBlockRegex));
      
      console.log(`Found ${matches.length} cinema blocks in the response text`);
      
      matches.forEach((match, index) => {
        const name = match[1].trim();
        let description = match[2].trim();
        
        if (!name || processedNames.has(name.toLowerCase())) {
          return;
        }
        
        console.log(`Extracted cinema #${index+1}: "${name}" with description: "${description.substring(0, 50)}..."`);
        
        cinemaDetails.push({
          name,
          description,
          address: '',
          url: ''
        });
        
        processedNames.add(name.toLowerCase());
      });
    } catch (error) {
      console.error('Error extracting cinema details from text:', error);
    }
    
    return cinemaDetails;
  }, []);

  const extractCinemasFromResponse = useCallback((responseText: string): ExtendedCinema[] => {
    console.log('Extracting cinemas from response text');
    const cinemaObjects: ExtendedCinema[] = [];
    const processedNames = new Set<string>();
    
    try {
      try {
        const jsonResponse = JSON.parse(responseText);
        const cinemaNames = extractCinemaNamesFromJsonResponse(jsonResponse);
        const details = extractCinemaDetailsFromResponseText(responseText);
        
        if (cinemaNames.length > 0) {
          console.log(`Found ${cinemaNames.length} cinema names in JSON response`);
          cinemaNames.forEach(name => {
            const matchingDetail = details.find(d => 
              d.name.toLowerCase() === name.toLowerCase()
            );
            
            if (matchingDetail) {
              cinemaObjects.push(createPlaceholderCinema(
                name,
                matchingDetail.address,
                matchingDetail.description,
                matchingDetail.url
              ));
              processedNames.add(name.toLowerCase());
              console.log(`Added cinema with details: "${name}"`);
            } else {
              cinemaObjects.push(createPlaceholderCinema(name));
              processedNames.add(name.toLowerCase());
              console.log(`Added cinema from JSON without details: "${name}"`);
            }
          });
        }
      } catch (e) {
        console.log('Response is not JSON, treating as text');
      }
      
      if (cinemaObjects.length === 0) {
        console.log('No cinemas found in JSON structure, extracting from text brackets');

        const bracketPattern = /\[(.*?)\]/g;
        const matches = Array.from(responseText.matchAll(bracketPattern));
        
        console.log(`Found ${matches.length} potential cinema names in brackets`);
        
        for (const match of matches) {
          const cinemaName = match[1].trim();
          
          if (!cinemaName || 
              cinemaName.toLowerCase().includes('here are') ||
              processedNames.has(cinemaName.toLowerCase())) {
            continue;
          }
          
          cinemaObjects.push(createPlaceholderCinema(cinemaName));
          processedNames.add(cinemaName.toLowerCase());
          console.log(`Added cinema from brackets: "${cinemaName}"`);
        }
      }
      
      console.log(`Extracted ${cinemaObjects.length} cinemas from AI response`);
      return cinemaObjects;
    } catch (error) {
      console.error('Error extracting cinemas from response:', error);
      return [];
    }
  }, [createPlaceholderCinema, extractCinemaNamesFromJsonResponse, extractCinemaDetailsFromResponseText]);

  useEffect(() => {
    if (initializedRef.current) {
      console.log('Initial data load already completed, skipping');
      return;
    }
    
    console.log('Starting initial data load for CinemaGallery');
    
    console.log('Initializing CinemaGallery with params:', { 
      searchQuery, 
      hasSearchCinemas: searchCinemas.length > 0,
      hasAiResponse: Boolean(aiResponse),
      fromAI 
    });
    
    if (searchCinemas.length > 0) {
      console.log('RAW searchCinemas data:', JSON.stringify(searchCinemas.slice(0, 3)));
    }
    
    if (aiResponse) {
      console.log('RAW AI response (first 300 chars):', aiResponse.substring(0, 300));
    }
    
    console.log('CinemaGallery: Checking for AI cinema data');
    setIsLoading(true);
    
    let initialCinemas: ExtendedCinema[] = [];
    
    if (structuredCinemaData && structuredCinemaData.cinemas && structuredCinemaData.cinemas.length > 0) {
      console.log('Found structured cinema data, using it');
      initialCinemas = structuredCinemaData.cinemas.map(cinema => {
        const cinemaAddress = cinema.address || '';
        console.log(`Processing cinema: ${cinema.name} with address: ${cinemaAddress}`);
        
        return createPlaceholderCinema(
          cinema.name,
          cinemaAddress,
          cinema.description || '',
          cinema.url || ''
        );
      });
      
      console.log(`Created ${initialCinemas.length} cinemas from structured data`);
    }
    else if (aiResponse) {
      console.log('Processing AI response for cinemas');
      initialCinemas = extractCinemasFromResponse(aiResponse);
      console.log(`Found ${initialCinemas.length} cinemas in AI response`);
    }
    else if (searchCinemas.length > 0) {
      initialCinemas = processAICinemas();
      console.log(`Created ${initialCinemas.length} cinemas from searchCinemas array`);
    }
    
    setAiCinemas(initialCinemas);
    setIsLoading(false);
  
    initializedRef.current = true;
    console.log('Initial data load complete');
    
  }, [
    searchCinemas, 
    processAICinemas, 
    aiResponse, 
    searchQuery, 
    fromAI, 
    createPlaceholderCinema,
    extractCinemasFromResponse
  ]);
  
  useEffect(() => {
    if (userLocation && aiCinemas.length > 0) {
      console.log('User location changed, checking if distances need updating');
      const needsDistanceUpdate = aiCinemas.some(cinema => cinema.distance === null);
      
      if (needsDistanceUpdate) {
        console.log('Some cinemas need distance updates, processing...');
        const updatedCinemas = updateCinemaDistances(aiCinemas);
        setAiCinemas(updatedCinemas);
    } else {
        console.log('All cinemas already have distances calculated, skipping update');
      }
    }
  }, [userLocation, updateCinemaDistances]);
  
  const handleCinemaTap = useCallback((cinema) => {
    console.log('Navigating to cinema details with data:', cinema);
    const cinemaData = {
      ...cinema,
      name: cinema.name,
      description: cinema.description || '',
      url: cinema.url || '',
      address: cinema.address || '',
      distance: cinema.distance,
      location: cinema.location,
      city: cinema.city || '',
      state: cinema.state || ''
    };
    
    navigation.navigate('CinemaDetails', { 
      cinemaName: cinemaData.name,
      description: cinemaData.description,
      url: cinemaData.url,
      address: cinemaData.address,
      distance: cinemaData.distance,
      location: cinemaData.location,
      city: cinemaData.city,
      state: cinemaData.state,
      aiCinemaData: cinemaData, 
      fromAI: true 
    });
  }, [navigation]);

  const renderCinemaItem = useCallback(({ item }: { item: ExtendedCinema }) => (
    <TouchableOpacity
      style={styles.cinemaCard}
      onPress={() => handleCinemaTap(item)}
    >
      <View style={styles.cinemaInfoContainer}>
        <View style={styles.cinemaNameContainer}>
          <Text style={styles.cinemaName}>{item.name}</Text>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.cinemaAddress} numberOfLines={2}>
          {item.address || 'Address unavailable'}
        </Text>
        <View style={styles.distanceContainer}>
          <Ionicons name="location" size={14} color="#FEBD69" />
          {item.distance ? (
          <Text style={styles.distanceText}>{item.distance.toFixed(1)} miles away</Text>
          ) : (
            <Text style={styles.distanceText}>Distance unavailable</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  ), [handleCinemaTap]);

  const headerTitle = searchQuery ? `Cinemas: ${searchQuery}` : 'Nearby Cinemas';

  const dynamicStyles = StyleSheet.create({
    scrollViewContent: {
      ...styles.cinemaListContainer,
      paddingBottom: chatboxHeight > 0 ? chatboxHeight + 20 : 120, 
    }
  });

  const renderContent = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FEBD69" />
          <Text style={styles.loadingText}>Loading cinemas...</Text>
        </View>
      );
    }

    if (!locationPermissionDenied && !userLocation && aiCinemas.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FEBD69" />
          <Text style={styles.loadingText}>Waiting for location permission...</Text>
          <Text style={styles.emptySubText}>
            Please grant location access to find cinemas near you.
          </Text>
        </View>
      );
    }

    if (aiCinemas.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No cinemas found</Text>
          <Text style={styles.emptySubText}>
            We couldn't find any cinemas matching your search. Please try a different search query.
          </Text>
        </View>
      );
    }

    console.log(`Rendering FlatList with ${aiCinemas.length} cinemas from AI`);

    return (
      <FlatList
        data={aiCinemas}
        keyExtractor={(item, index) => `cinema-${item.id || index}`}
        renderItem={renderCinemaItem}
        contentContainerStyle={dynamicStyles.scrollViewContent}
      />
    );
  }, [isLoading, aiCinemas, renderCinemaItem, dynamicStyles, userLocation, locationPermissionDenied]);

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        <NavigationHeader 
          title={headerTitle} 
          backgroundColor={COLORS.gunmetal}
        />
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {renderContent()}
      </SafeAreaView>
      <AIChatBox />
    </View>
  );
};

export default CinemaGallery; 