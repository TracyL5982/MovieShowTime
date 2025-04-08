import { StyleSheet } from 'react-native';
import { BORDER_RADIUS } from './MovieGallery.styles';

// Constants for colors
export const COLORS = {
  background: '#F2F2F7',
  iconColor: '#000000',
  text: '#000000',
  placeholder: 'rgba(60, 60, 67, 0.6)'
};

// Icon configurations
export const ICON_CONFIG = {
  size: 20
};

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS,
    height: 40,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 17,
    fontFamily: 'Inter-Regular',
  },
  iconContainer: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
  }
}); 