import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Keyboard, 
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ScrollView
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setResponse } from '../store/aiSlice';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import OpenAI from 'openai';
import { styles, inputTheme, loadingInputTheme, keyboardAvoidingViewProps, ICON_CONFIG } from '../styles/AIChatBox.styles';
import { COLORS, RADIUS } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true,
});

const SCREEN_TYPES = {
  MOVIE_GALLERY: 'movie_gallery',
  MOVIE_DETAILS: 'movie_details',
  CINEMA_GALLERY: 'cinema_gallery',
  CINEMA_DETAILS: 'cinema_details',
  MOVIE_SHOWTIMES: 'movie_showtimes',
  START_SCREEN: 'start_screen'
};

const AIChatBox: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { isVisible, response } = useSelector((state: RootState) => state.ai);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [pendingInput, setPendingInput] = useState('');
  const [responseHeight, setResponseHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);
  
  useEffect(() => {
    if (response) {
      setResponseHeight(0);
      setContainerHeight(0);
      setIsExpanded(true);
    }
  }, [response]);


  useEffect(() => {
    if (responseHeight > 0 && containerHeight > 0) {
      const shouldShow = responseHeight > (styles.truncatedResponseContainer.maxHeight - 40);
      setShouldShowToggle(shouldShow);

      console.log('Response height:', responseHeight);
      console.log('Container height:', containerHeight);
      console.log('Should show toggle:', shouldShow);
    }
  }, [responseHeight, containerHeight]);

  useEffect(() => {
    if (isKeyboardVisible) {
      setIsExpanded(false);
    }
  }, [isKeyboardVisible]);
  
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        setKeyboardVisible(true);
        setKeyboardHeight(event.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const extractEntitiesFromResponse = async (response) => {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Analyze the following AI response and extract movie titles and cinema names mentioned in it.
            Format your response as a JSON object with the following structure:
            {
              "movieTitles": ["Movie1", "Movie2", ...],
              "cinemaNames": ["Cinema1", "Cinema2", ...],
              "hasMultipleMovies": true/false,
              "hasMultipleCinemas": true/false,
              "primaryMovie": "MainMovie", // The most prominently featured movie, if any
              "primaryCinema": "MainCinema" // The most prominently featured cinema, if any
            }
            
            Only include actual movie titles and cinema names that are clearly mentioned.
            If none are present, return empty arrays. Do not make up or include generic terms.`
          },
          { role: 'user', content: response }
        ],
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error extracting entities from response:', error);
      return { movieTitles: [], cinemaNames: [], hasMultipleMovies: false, hasMultipleCinemas: false };
    }
  };

  const determineScreenType = async (userQuery) => {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for a movie showtime app. Based on the user's query, determine which screen should be shown.
            Return ONLY one of the following screen types with NO additional text. Find data corresponding to the user's query:
            - ${SCREEN_TYPES.MOVIE_GALLERY} - if the user wants to see a list of movies (e.g., "what movies are playing", "show me movies in theaters")
            - ${SCREEN_TYPES.MOVIE_DETAILS} - if the user wants details about a specific movie (e.g., "tell me about Dune", "show information for Godzilla x Kong")
            - ${SCREEN_TYPES.CINEMA_GALLERY} - if the user wants to see cinemas/theaters (e.g., "show me nearby theaters", "what cinemas are close to me")
            - ${SCREEN_TYPES.CINEMA_DETAILS} - if the user wants to see details about a specific cinema (e.g., "tell me about AMC Empire 25", "show information for Regal Cinemas")
            - ${SCREEN_TYPES.MOVIE_SHOWTIMES} - if the user wants showtimes for a movie (e.g., "when is Dune playing", "showtimes for Godzilla")
            - ${SCREEN_TYPES.START_SCREEN} - if the user wants to go to the home screen or start over (e.g., "go home", "start screen", "main menu")
            
            If the query doesn't clearly match any of the screens, don't return any screen type. In these cases, just respond conversationally to the user without changing screens.
            `
          },
          { role: 'user', content: userQuery }
        ],
        temperature: 0.1,
        max_tokens: 50,
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error determining screen type:', error);
      return '';
    }
  };

  const extractMovieTitle = async (userQuery) => {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Extract the movie title from the user query. Return ONLY the movie title with no other text. If no specific movie is mentioned, return "NONE".'
          },
          { role: 'user', content: userQuery }
        ],
        temperature: 0.1,
        max_tokens: 50,
      });

      const title = completion.choices[0].message.content.trim();
      return title === 'NONE' ? null : title;
    } catch (error) {
      console.error('Error extracting movie title:', error);
      return null;
    }
  };

  const extractCinemaName = async (userQuery) => {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Extract the cinema/theater name from the user query. Return ONLY the cinema name with no other text. If no specific cinema is mentioned, return "NONE".'
          },
          { role: 'user', content: userQuery }
        ],
        temperature: 0.1,
        max_tokens: 50,
      });

      const name = completion.choices[0].message.content.trim();
      return name === 'NONE' ? null : name;
    } catch (error) {
      console.error('Error extracting cinema name:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    Keyboard.dismiss();
    setIsLoading(true);
    setPendingInput(input); 
    
    try {
      const conversationCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant integrated in a movie booking app. Respond conversationally and briefly. 4 sentences maximum.',
          },
          { role: 'user', content: input },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const aiResponse = conversationCompletion.choices[0].message.content;
      if (aiResponse) {
        dispatch(setResponse(aiResponse));
        setIsExpanded(true); 
      }

      const extractedEntities = await extractEntitiesFromResponse(aiResponse);
      console.log('Extracted entities:', extractedEntities);
      const requestedScreenType = await determineScreenType(input);
      console.log('Determined screen type from query:', requestedScreenType);

      if (extractedEntities.primaryMovie && !extractedEntities.hasMultipleMovies) {
        navigation.navigate('MovieGallery', { searchQuery: extractedEntities.primaryMovie });
      } else if (extractedEntities.primaryCinema && !extractedEntities.hasMultipleCinemas) {
        navigation.navigate('CinemaGallery', { searchQuery: extractedEntities.primaryCinema });
      } else if (extractedEntities.hasMultipleMovies && extractedEntities.movieTitles.length > 0) {
        navigation.navigate('MovieGallery');
      } else if (extractedEntities.hasMultipleCinemas && extractedEntities.cinemaNames.length > 0) {
        navigation.navigate('CinemaGallery');
      } else {
        switch (requestedScreenType) {
          case SCREEN_TYPES.MOVIE_GALLERY:
            navigation.navigate('MovieGallery');
            break;

          case SCREEN_TYPES.MOVIE_DETAILS:
            const movieTitle = await extractMovieTitle(input);
            if (movieTitle) {
              navigation.navigate('MovieGallery', { searchQuery: movieTitle });
            } else {
              navigation.navigate('MovieGallery');
            }
            break;

          case SCREEN_TYPES.CINEMA_GALLERY:
            navigation.navigate('CinemaGallery');
            break;

          case SCREEN_TYPES.CINEMA_DETAILS:
            const cinemaName = await extractCinemaName(input);
            if (cinemaName) {
              navigation.navigate('CinemaGallery', { searchQuery: cinemaName });
            } else {
              navigation.navigate('CinemaGallery');
            }
            break;

          case SCREEN_TYPES.MOVIE_SHOWTIMES:
            const showtimeMovieTitle = await extractMovieTitle(input);
            if (showtimeMovieTitle) {
              const today = new Date().toISOString().split('T')[0];
              navigation.navigate('MovieShowtime', { 
                movieTitle: showtimeMovieTitle,
                date: today
              });
            } else {
              navigation.navigate('MovieGallery');
            }
            break;
            
          case SCREEN_TYPES.START_SCREEN:
            navigation.navigate('StartScreen');
            break;

          default:
            if (extractedEntities.movieTitles.length > 0) {
              navigation.navigate('MovieGallery', { searchQuery: extractedEntities.movieTitles[0] });
            } else if (extractedEntities.cinemaNames.length > 0) {
              navigation.navigate('CinemaGallery', { searchQuery: extractedEntities.cinemaNames[0] });
            }
            break;
        }
      }

      setInput(''); 
      setPendingInput(''); 
    } catch (error) {
      console.error('Error fetching from OpenAI:', error);
      dispatch(setResponse('Sorry, I encountered an error. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isVisible) return null;
  const chatBottomPosition = isKeyboardVisible ? keyboardHeight : 0;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: chatBottomPosition,
        zIndex: 1000,
      }}
    >
      {response && (
        <View style={styles.chatBoxContainer}>
          {Platform.OS === 'ios' ? (
            <BlurView 
              intensity={50} 
              tint="light"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderTopLeftRadius: RADIUS.medium,
                borderTopRightRadius: RADIUS.medium,
              }}
            />
          ) : null}
          <View style={[
            styles.responseContainer, 
            isExpanded ? styles.expandedResponseContainer : styles.truncatedResponseContainer
          ]}
            onLayout={(event) => {
              const height = event.nativeEvent.layout.height;
              setContainerHeight(height);
            }}
          >
            <ScrollView 
              scrollEnabled={isExpanded}
              showsVerticalScrollIndicator={isExpanded}
              onContentSizeChange={(width, height) => {
                setResponseHeight(height);
              }}
            >
              <Text style={styles.responseText}>{response}</Text>
            </ScrollView>
            
            {shouldShowToggle && (
              <View style={styles.toggleButtonContainer}>
                <TouchableOpacity 
                  style={styles.toggleButton} 
                  onPress={toggleExpanded}
                >
                  <Text style={styles.toggleButtonText}>
                    {isExpanded ? 'Show Less' : 'Show More'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={isLoading ? pendingInput : input}
                onChangeText={setInput}
                placeholder="Ask me anything..."
                placeholderTextColor={COLORS.silverGray}
                mode="flat"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                selectionColor={COLORS.iosBlue}
                theme={isLoading ? loadingInputTheme : inputTheme}
                disabled={isLoading}
                multiline={true}
                numberOfLines={3}
              />
              <TouchableOpacity 
                style={[
                  styles.iconButton, 
                  input.trim() && !isLoading ? styles.iconButtonActive : styles.iconButtonInactive
                ]} 
                onPress={handleSubmit}
                disabled={!input.trim() || isLoading}
              >
                <Ionicons 
                  name="arrow-up" 
                  size={ICON_CONFIG.size} 
                  color={input.trim() && !isLoading ? COLORS.eerieBlack : COLORS.charcoalGray} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {!response && (
        <View style={styles.chatBoxContainer}>
          {Platform.OS === 'ios' ? (
            <BlurView 
              intensity={50} 
              tint="light"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderTopLeftRadius: RADIUS.medium,
                borderTopRightRadius: RADIUS.medium,
              }}
            />
          ) : null}
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={isLoading ? pendingInput : input}
                onChangeText={setInput}
                placeholder="Ask me anything..."
                placeholderTextColor={COLORS.silverGray}
                mode="flat"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                selectionColor={COLORS.iosBlue}
                theme={isLoading ? loadingInputTheme : inputTheme}
                disabled={isLoading}
                multiline={true}
                numberOfLines={3}
              />
              <TouchableOpacity 
                style={[
                  styles.iconButton, 
                  input.trim() && !isLoading ? styles.iconButtonActive : styles.iconButtonInactive
                ]} 
                onPress={handleSubmit}
                disabled={!input.trim() || isLoading}
              >
                <Ionicons 
                  name="arrow-up" 
                  size={ICON_CONFIG.size} 
                  color={input.trim() && !isLoading ? COLORS.eerieBlack : COLORS.charcoalGray} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default AIChatBox;
