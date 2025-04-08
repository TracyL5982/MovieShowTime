import { TextStyle } from 'react-native';
import { COLORS } from './colors';

// Font families used throughout the app
export const FONTS = {
  primary: 'Inter',
  primaryRegular: 'Inter-Regular',
  primaryMedium: 'Inter-Medium',
  primaryBold: 'Inter-Bold',
  primarySemiBold: 'Inter-SemiBold',
};

// Font sizes for different text types
export const FONT_SIZES = {
  tiny: 9,
  small: 13,
  medium: 15, 
  regular: 17,
  large: 20,
  xlarge: 24,
  xxlarge: 32,
};

// Font weights
export const FONT_WEIGHTS: {[key: string]: TextStyle['fontWeight']} = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

// Pre-defined text styles
export const TEXT_STYLES = {
  header: {
    fontFamily: FONTS.primary,
    fontSize: FONT_SIZES.regular,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.pureWhite,
  } as TextStyle,
  
  title: {
    fontFamily: FONTS.primary,
    fontSize: FONT_SIZES.large,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.pureWhite,
  } as TextStyle,
  
  subtitle: {
    fontFamily: FONTS.primary,
    fontSize: FONT_SIZES.medium,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.pureWhite,
  } as TextStyle,
  
  body: {
    fontFamily: FONTS.primaryRegular,
    fontSize: FONT_SIZES.regular,
    color: COLORS.pureWhite,
  } as TextStyle,
  
  caption: {
    fontFamily: FONTS.primaryRegular,
    fontSize: FONT_SIZES.small,
    color: COLORS.silverGray,
  } as TextStyle,
  
  tiny: {
    fontFamily: FONTS.primaryRegular,
    fontSize: FONT_SIZES.tiny,
    color: COLORS.pureWhite,
  } as TextStyle,
}; 