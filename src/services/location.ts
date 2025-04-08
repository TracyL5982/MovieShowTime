import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface GeocodeResult {
  city: string;
  region: string;
  country: string;
  postalCode: string;
  name: string;
}

// request and get the user's current location
export const getCurrentLocation = async (): Promise<UserLocation | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.error('Location permission not granted');
      return null;
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

// get address information based on coordinates
export const getAddressFromCoordinates = async (
  latitude: number, 
  longitude: number
): Promise<GeocodeResult | null> => {
  try {
    const geoCodeResults = await Location.reverseGeocodeAsync({
      latitude,
      longitude
    });
    
    if (geoCodeResults && geoCodeResults.length > 0) {
      const result = geoCodeResults[0];
      return {
        city: result.city || '',
        region: result.region || '',
        country: result.country || '',
        postalCode: result.postalCode || '',
        name: result.name || ''
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error geocoding location:', error);
    return null;
  }
};

// Calculate distance between two coordinates in kilometers
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; 
  return distance;
};

// Convert degrees to radians
const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};

// Convert kilometers to miles
export const kmToMiles = (km: number): number => {
  return km * 0.621371;
};

// Default location for fallback (New York City)
export const DEFAULT_LOCATION = {
  latitude: 40.7128,
  longitude: -74.0060,
  timestamp: Date.now()
}; 