import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from './src/store';
import StartScreen from './src/screens/StartScreen';
import MovieGallery from './src/screens/MovieGallery';
import MovieDetails from './src/screens/MovieDetails';
import MovieShowtime from './src/screens/MovieShowtime';
import CinemaGallery from './src/screens/CinemaGallery';
import CinemaDetails from './src/screens/CinemaDetails';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { 
  Inter_400Regular,
  Inter_300Light, 
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import navigationHistory from './src/services/navigationHistory';

SplashScreen.preventAutoHideAsync();

// Define navigator param list type
type RootStackParamList = {
  StartScreen: undefined;
  MovieGallery: any;
  MovieDetails: any;
  MovieShowtime: any;
  CinemaGallery: any;
  CinemaDetails: any;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter': Inter_400Regular,
    'Inter-Light': Inter_300Light,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-Regular': Inter_400Regular,
  });
  
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const routeNameRef = useRef<string | null>(null);

  useEffect(() => {
    // Initialize navigation history
    navigationHistory.initialize();
  }, []);

  useEffect(() => {
    async function prepare() {
      if (fontsLoaded) {
        // This tells the splash screen to hide immediately
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          // Save the initial route name
          const currentRoute = navigationRef.current?.getCurrentRoute();
          routeNameRef.current = currentRoute?.name || null;
          
          // Add the initial route to history if it exists
          if (currentRoute?.name) {
            console.log(`Adding initial route: ${currentRoute.name}`);
            navigationHistory.addToHistory(currentRoute.name, currentRoute.params);
          }
        }}
        onStateChange={() => {
          const previousRouteName = routeNameRef.current;
          const currentRoute = navigationRef.current?.getCurrentRoute();
          const currentRouteName = currentRoute?.name;
          
          if (currentRouteName && previousRouteName !== currentRouteName) {
            console.log(`Navigation changed: ${previousRouteName} → ${currentRouteName}`);
            
            // Record route change to history
            navigationHistory.addToHistory(currentRouteName, currentRoute?.params);
            
            // For debugging - check if logHistory exists before calling
            if (typeof navigationHistory.logHistory === 'function') {
              navigationHistory.logHistory();
            }
          }
          
          // Save the current route name for the next state change
          routeNameRef.current = currentRouteName ?? null;
        }}
      >
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="StartScreen"
          screenOptions={{ 
            headerShown: false,
            contentStyle: {
              backgroundColor: '#232F3E',
            }
          }}
        >
          <Stack.Screen name="StartScreen" component={StartScreen} />
          <Stack.Screen name="MovieGallery" component={MovieGallery} />
          <Stack.Screen name="MovieDetails" component={MovieDetails} />
          <Stack.Screen name="MovieShowtime" component={MovieShowtime} />
          <Stack.Screen name="CinemaGallery" component={CinemaGallery} />
          <Stack.Screen name="CinemaDetails" component={CinemaDetails} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
} 