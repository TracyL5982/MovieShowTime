import { StyleSheet } from 'react-native';

// Common colors and values for consistency
const COLORS = {
  background: '#232F3E', // Amazon Gunmetal
  cardBackground: '#131A22', // Amazon Eerie Black
  text: '#FFFFFF', // White
  textSecondary: '#F7F9FA', // Off-white
  accentColor: '#FEBD69', // Amazon Apricot
};

const BORDER_RADIUS = 15;

export const styles = StyleSheet.create({
  // Main wrapper
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Main container
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.text,
    marginLeft: 16,
  },
  
  // Search bar container
  searchBarContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
    height: 50,
    justifyContent: 'center',
  },
  
  // Search bar component
  searchBar: {
    height: 40,
    elevation: 0,
    backgroundColor: '#F2F2F7',
    borderRadius: BORDER_RADIUS,
  },
  
  // Cinema list container
  cinemaListContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    paddingBottom: 220,
    width: '100%',
  },
  
  // Cinema card
  cinemaCard: {
    width: '100%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS,
    marginBottom: 10,
    padding: 16,
    overflow: 'hidden',
  },
  
  // Cinema info container
  cinemaInfoContainer: {
    width: '100%',
    marginTop: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 5,
  },
  
  // Cinema name container with arrow
  cinemaNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  
  // Cinema name
  cinemaName: {
    fontSize: 17,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
  },
  
  // Cinema address
  cinemaAddress: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  
  // Distance container with icon
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  
  // Distance text
  distanceText: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.accentColor,
  },
  
  // Loading container
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Loading text
  loadingText: {
    fontFamily: 'Inter',
    fontSize: 17,
    color: COLORS.text,
  },
  
  // Error container
  errorContainer: {
    padding: 16,
    margin: 16,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: BORDER_RADIUS,
    alignItems: 'center',
  },
  
  // Error text
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FF0000',
    textAlign: 'center',
  },
  
  // Empty state container
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    height: 200,
  },
  
  // Empty state text
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 17,
    color: COLORS.text,
    textAlign: 'center',
  },
  
  // Empty sub text
  emptySubText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
}); 