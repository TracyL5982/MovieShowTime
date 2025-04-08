import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
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

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter': Inter_400Regular,
    'Inter-Light': Inter_300Light,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-Regular': Inter_400Regular,
  });

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
      <NavigationContainer>
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