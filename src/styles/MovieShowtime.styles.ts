import { StyleSheet } from 'react-native';
import { COLORS } from './colors';

const BORDER_RADIUS = 15;

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
  
  // Safe area container
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.gunmetal,
  },
  
  // Header container
  header: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
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
    fontSize: 17,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.pureWhite,
    marginLeft: 16,
  },
  
  // Movie title
  movieTitle: {
    fontSize: 24,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: COLORS.pureWhite,
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  
  // Content container
  contentContainer: {
    width: 361,
    paddingBottom: 160,
    alignSelf: 'center',
  },
  
  // Scroll content
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 160,
  },
  
  // Date selector container
  dateSelector: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 25,
  },
  
  // Date navigation arrow
  dateArrow: {
    width: 16,
    height: 25,
  },
  
  // Date item container
  dateItem: {
    width: 80,
    height: 50,
    position: 'relative',
  },
  
  // Active date indicator
  activeDateIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 80,
    height: 2,
    backgroundColor: '#FF9900',
  },
  
  // Inactive date indicator
  inactiveDateIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 80,
    height: 2,
    backgroundColor: '#F2F2F2',
  },
  
  // Date text container
  dateTextContainer: {
    width: 80,
    height: 37,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Date name text (e.g., TODAY)
  dateName: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.pureWhite,
    textAlign: 'center',
  },
  
  // Date value text 
  dateValue: {
    fontSize: 9,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: COLORS.pureWhite,
    textAlign: 'center',
  },
  
  // Filter options container
  filterContainer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 25,
    marginBottom: 25,
  },
  
  // Filter button
  filterButton: {
    width: 168,
    height: 41,
    backgroundColor: '#131A22',
    borderRadius: BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Filter button content
  filterButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
  },
  
  // Filter text
  filterText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: COLORS.pureWhite,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  
  // Showtimes list container
  showtimesContainer: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    gap: 10,
  },
  
  // Showtime item (old style)
  showtimeItem: {
    width: '100%',
    height: 68,
    backgroundColor: '#131A22',
    borderRadius: BORDER_RADIUS,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  
  // New showtime card style
  showtimeCard: {
    width: '100%',
    backgroundColor: '#131A22',
    borderRadius: BORDER_RADIUS,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'column',
    gap: 8,
  },
  
  // Time container
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Time text
  timeText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: COLORS.pureWhite,
  },
  
  // End time text
  endTimeText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#8A8A8E',
  },
  
  // Price and format container
  priceFormatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  // Price text
  priceText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#FEBD69',
    marginTop: 4,
  },
  
  // Format tag
  formatTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#232F3E',
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  
  // Format text
  formatText: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.pureWhite,
  },
  
  // Movie info container
  movieInfoContainer: {
    width: 190,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 12,
  },
  
  // Movie name
  movieName: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: COLORS.pureWhite,
  },
  
  // Showtime text
  showtimeText: {
    fontSize: 9,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: COLORS.pureWhite,
  },
  
  // Theater info container
  theaterInfoContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  
  // Theater name
  theaterName: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: COLORS.pureWhite,
    flex: 1,
    paddingRight: 4,
  },
  
  // Distance container
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 60,
  },
  
  // Distance text
  distanceText: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#FEBD69',
  },
  
  // Loading container
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Loading text
  loadingText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.pureWhite,
    marginTop: 10,
  },
  
  // Error container
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Error text
  errorText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    color: '#FF6B6B',
    textAlign: 'center',
  },
  
  // No showtimes container
  noShowtimesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  
  // No showtimes text
  noShowtimesText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.pureWhite,
    textAlign: 'center',
  },
  
  // Language selection button
  languageButton: {
    width: 80,
    height: 27,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.pureWhite,
  },
  
  // Language button text
  languageButtonText: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: COLORS.pureWhite,
  },
  
  // No results text
  noResultsText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: COLORS.pureWhite,
    textAlign: 'center',
  },
  
  // Empty state container
  emptyStateContainer: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Empty state text
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: COLORS.pureWhite,
    textAlign: 'center',
  },
}); 