import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS, FONTS, FONT_SIZES, FONT_WEIGHTS, SPACING } from './theme';

// Text input theme for the search bar
export const searchBarTheme = {
  fonts: { 
    regular: { 
      fontFamily: FONTS.primaryRegular 
    } 
  },
  colors: {
    text: COLORS.eerieBlack,
    placeholder: 'rgba(60, 60, 67, 0.6)',
  }
};

export const styles = StyleSheet.create({
  // Main wrapper
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.gunmetal,
  },
  
  // Main container
  container: {
    flex: 1,
    backgroundColor: COLORS.gunmetal,
  },
  
  // Header container
  header: {
    width: 361,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.medium,
    marginTop: 10,
  },
  
  // Back button
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Header title
  headerTitle: {
    fontSize: FONT_SIZES.regular,
    fontFamily: FONTS.primary,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.pureWhite,
    marginLeft: SPACING.medium,
  },
  
  // Search bar container
  searchBarContainer: {
    height: 50,
    paddingHorizontal: SPACING.medium,
    marginTop: SPACING.small,
    marginBottom: SPACING.small,
    justifyContent: 'center',
  },
  
  // Search bar
  searchBar: {
    height: 40,
    elevation: 0,
    backgroundColor: COLORS.platinumGray,
    borderRadius: RADIUS.medium,
  },
  
  // Movie cards container
  movieCardsContainer: {
    paddingHorizontal: SPACING.medium,
    marginTop: SPACING.medium,
    paddingBottom: 220,
  },
  
  // Row of movie cards
  movieCardRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.medium,
    gap: 10,
  },
  
  // Movie card
  card: {
    width: 170,
    height: 244,
    backgroundColor: COLORS.pureWhite,
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  
  // Movie poster image
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  
  // Overlay at the bottom of the card
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 95,
    backgroundColor: COLORS.blackOverlay95,
    justifyContent: 'flex-start',
  },
  
  // Content container inside overlay for proper spacing
  overlayContent: {
    width: '100%',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.medium,
  },
  
  // Movie title text
  cardTitle: {
    fontSize: FONT_SIZES.medium,
    fontFamily: FONTS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.pureWhite,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  
  // Info container (rating, genres)
  infoContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 4,
  },
  
  // Genre text
  genreText: {
    fontSize: FONT_SIZES.tiny,
    fontFamily: FONTS.primary,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.pureWhite,
  },
  
  // Rating text
  ratingText: {
    fontSize: FONT_SIZES.tiny,
    fontFamily: FONTS.primary,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.pureWhite,
  },
  
  // FlatList style
  list: {
    paddingVertical: SPACING.medium,
  },
  
  // Loading container
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Loading text
  loadingText: {
    fontFamily: FONTS.primary,
    fontSize: FONT_SIZES.regular,
    color: COLORS.pureWhite,
  },
  
  // Error container
  errorContainer: {
    padding: SPACING.medium,
    backgroundColor: COLORS.alertRed,
    marginHorizontal: SPACING.medium,
    marginVertical: SPACING.medium,
    borderRadius: RADIUS.small,
    alignItems: 'center',
  },
  
  // Error text
  errorText: {
    color: COLORS.pureWhite,
    fontFamily: FONTS.primary,
    fontSize: FONT_SIZES.small,
    textAlign: 'center',
  },
  
  // Empty state container
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  
  // Empty state text
  emptyText: {
    fontFamily: FONTS.primary,
    fontSize: FONT_SIZES.regular,
    color: COLORS.pureWhite,
    textAlign: 'center',
  },
  
  scrollViewContainer: {
    paddingBottom: 180,
  },
}); 