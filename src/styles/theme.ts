import { COLORS } from './colors';
import { FONTS, FONT_SIZES, FONT_WEIGHTS, TEXT_STYLES } from './typography';
import { SPACING, RADIUS, SHADOWS, PLATFORM_SPECIFIC, SHAPES } from './layout';

// Paper UI theme configuration
export const PAPER_THEME = {
  fonts: { 
    regular: { 
      fontFamily: FONTS.primaryRegular
    } 
  },
  colors: {
    text: COLORS.pureWhite,
    placeholder: COLORS.silverGray,
    primary: COLORS.brightApricot,
  }
};

// Icon configuration
export const ICON_CONFIG = {
  size: {
    small: 16,
    medium: 20,
    large: 24,
    xlarge: 32
  },
  color: {
    primary: COLORS.brightApricot,
    light: COLORS.pureWhite,
    dark: COLORS.eerieBlack,
    inactive: COLORS.slateGray
  }
};

// Export everything
export {
  COLORS,
  FONTS,
  FONT_SIZES, 
  FONT_WEIGHTS,
  TEXT_STYLES,
  SPACING,
  RADIUS,
  SHADOWS,
  PLATFORM_SPECIFIC,
  SHAPES
}; 