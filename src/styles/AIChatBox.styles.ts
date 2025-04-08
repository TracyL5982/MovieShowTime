import { StyleSheet, Platform } from 'react-native';
import { COLORS, RADIUS, SHADOWS, PLATFORM_SPECIFIC, FONTS, FONT_SIZES } from './theme';

// Define common values for consistency
export const inputTheme = {
  colors: {
    primary: COLORS.iosBlue,
    placeholder: COLORS.silverGray,
    text: COLORS.eerieBlack,
    underlineColor: 'transparent',
    background: 'transparent',
  },
  roundness: 0,
};

// Input theme for loading state
export const loadingInputTheme = {
  ...inputTheme,
  colors: {
    ...inputTheme.colors,
    text: COLORS.slateGray,
  },
};

// Icon configuration
export const ICON_CONFIG = {
  size: 20,
};

// KeyboardAvoidingView props based on platform
export const keyboardAvoidingViewProps = {
  behavior: Platform.OS === 'ios' ? 'padding' : 'height' as 'padding' | 'height' | 'position',
  keyboardVerticalOffset: Platform.OS === 'ios' ? 90 : 0,
  style: {
    position: 'absolute' as 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  }
};

export const styles = StyleSheet.create({
  // Container for the entire chat box
  chatBoxContainer: {
    width: '100%',
    borderTopLeftRadius: RADIUS.medium,
    borderTopRightRadius: RADIUS.medium,
    backgroundColor: PLATFORM_SPECIFIC.blurBackground,
    paddingBottom: 30, 
    ...SHADOWS.large,
    overflow: 'hidden', 
  },
  
  // Container for input area (separate from response)
  inputContainer: {
    marginLeft: 16,
    marginRight: 16,
    marginBottom: 16,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.iosLightGray,
    ...SHADOWS.small,
  },
  
  // Input row with text input and button
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'flex-end',
    position: 'relative', 
  },
  
  // Text input
  input: {
    flex: 1,
    fontSize: 15, 
    fontFamily: FONTS.primaryRegular,
    color: COLORS.eerieBlack,
    backgroundColor: 'transparent',
    maxHeight: 100, 
    minHeight: 40, 
    paddingRight: 45, 
  },
  
  // Send button
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 16,
    bottom: 14, 
  },
  
  // Active send button
  iconButtonActive: {
    backgroundColor: COLORS.brightApricot,
  },
  
  // Inactive send button
  iconButtonInactive: {
    backgroundColor: COLORS.platinumGray,
  },
  
  // AI response container
  responseContainer: {
    position: 'relative',
    padding: 16,
    backgroundColor: COLORS.iosLightGray,
    borderRadius: RADIUS.medium,
    marginBottom: 16,
    marginTop: 16,
    marginLeft: 16,
    marginRight: 16,
  },
  
  // AI response text
  responseText: {
    fontSize: FONT_SIZES.small,
    fontFamily: FONTS.primaryRegular,
    color: COLORS.eerieBlack,
    marginBottom: 10, 
  },
  
  // Response container when expanded
  expandedResponseContainer: {
    maxHeight: 400,
    overflow: 'scroll',
  },
  
  // Response container when truncated
  truncatedResponseContainer: {
    maxHeight: 120,
    overflow: 'hidden',
  },
  
  // Toggle button container at bottom of response
  toggleButtonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  
  // Toggle button
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-end',
  },
  
  // Toggle button text
  toggleButtonText: {
    fontSize: 12,
    fontFamily: FONTS.primaryRegular,
    color: '#0066c0', 
  },
  
  // Response container when there is no response
  emptyResponseContainer: {
    display: 'none',
  },
}); 