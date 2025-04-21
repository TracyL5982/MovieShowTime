import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../styles/colors';
import { FONTS, FONT_SIZES } from '../styles/typography';
import navigationHistory from '../services/navigationHistory';

interface NavigationHeaderProps {
  title: string;
  customBackAction?: () => void;
  customForwardAction?: () => void;
  backButtonColor?: string;
  forwardButtonColor?: string;
  backgroundColor?: string;
  titleColor?: string;
  fontSize?: number;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  title,
  customBackAction,
  customForwardAction,
  backButtonColor = '#FFFFFF',
  forwardButtonColor = '#FFFFFF',
  backgroundColor = COLORS.gunmetal,
  titleColor = '#FFFFFF',
  fontSize
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  // Update back/forward state whenever the route changes
  useEffect(() => {
    // Check if we can go back/forward
    const updateButtonStates = () => {
      if (typeof navigationHistory.canGoBack === 'function') {
        setCanGoBack(navigationHistory.canGoBack());
      }
      if (typeof navigationHistory.canGoForward === 'function') {
        setCanGoForward(navigationHistory.canGoForward());
      }
      console.log(`[Header] Can go back: ${canGoBack}, Can go forward: ${canGoForward}`);
    };
    
    updateButtonStates();

    // Return cleanup function that will run before the next render
    return updateButtonStates;
  }, [route.name, route.params]); // Re-run when route changes

  const handleBackPress = () => {
    if (customBackAction) {
      customBackAction();
      return;
    }
    
    if (navigationHistory.canGoBack()) {
      const prevRoute = navigationHistory.goBack();
      if (prevRoute) {
        // @ts-ignore - Dynamic navigation
        navigation.navigate(prevRoute.routeName, prevRoute.params);
      }
    } else {
      // Fallback to standard navigation back if history is empty
      navigation.goBack();
    }
  };

  const handleForwardPress = () => {
    if (customForwardAction) {
      customForwardAction();
      return;
    }
    
    if (navigationHistory.canGoForward()) {
      const nextRoute = navigationHistory.goForward();
      if (nextRoute) {
        console.log(`[Header] Navigating forward to: ${nextRoute.routeName}`);
        // @ts-ignore - Dynamic navigation
        navigation.navigate(nextRoute.routeName, nextRoute.params);
      }
    }
  };

  // Helper function to determine button colors
  const getBackButtonColor = () => {
    if (customBackAction) return backButtonColor;
    return canGoBack ? backButtonColor : 'rgba(255, 255, 255, 0.3)';
  };

  const getForwardButtonColor = () => {
    if (customForwardAction) return forwardButtonColor;
    return canGoForward ? forwardButtonColor : 'rgba(255, 255, 255, 0.3)';
  };

  return (
    <View style={[styles.header, { backgroundColor }]}>
      <TouchableOpacity 
        onPress={handleBackPress} 
        style={styles.backButton}
        disabled={!canGoBack && !customBackAction}
      >
        <Ionicons 
          name="chevron-back" 
          size={28} 
          color={getBackButtonColor()} 
        />
      </TouchableOpacity>
      
      <Text style={[styles.headerTitle, { color: titleColor, fontSize: fontSize || FONT_SIZES.large }]} numberOfLines={1}>
        {title}
      </Text>
      
      <TouchableOpacity 
        onPress={handleForwardPress} 
        style={styles.forwardButton}
        disabled={!canGoForward && !customForwardAction}
      >
        <Ionicons 
          name="chevron-forward" 
          size={28} 
          color={getForwardButtonColor()} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.large,
    fontFamily: FONTS.primaryBold,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  forwardButton: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default NavigationHeader; 