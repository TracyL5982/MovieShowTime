import { Platform } from 'react-native';
import { COLORS } from './colors';

// Consistent spacing values
export const SPACING = {
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 48,
};

// Border radius constants
export const RADIUS = {
  small: 8,
  medium: 15,
  large: 24,
  round: 50,
};

// Shadow styles
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Platform-specific styles
export const PLATFORM_SPECIFIC = {
  blurBackground: Platform.OS === 'ios' 
    ? COLORS.whiteOverlay50
    : COLORS.whiteOverlay70,
  keyboardBehavior: Platform.OS === 'ios' ? 'padding' : 'height',
};

// Common component shape styles
export const SHAPES = {
  cardContainer: {
    borderRadius: RADIUS.medium,
    ...SHADOWS.medium,
    overflow: 'hidden',
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
}; 