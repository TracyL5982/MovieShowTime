import { StyleSheet } from 'react-native';

// Common colors and values for consistency
const COLORS = {
  background: '#232F3E', // Amazon Gunmetal
  cardBackground: '#131A22', // Amazon Eerie Black
  text: '#FFFFFF', // White
  textSecondary: '#F7F9FA', // Off-white
  accentColor: '#FEBD69', // Amazon Apricot
  errorColor: '#FF6B6B', // Error red
};

const BORDER_RADIUS = 15;

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Header (similar to MovieGallery)
  header: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
    marginLeft: 16,
  },
  // Poster container (now separate from header)
  posterContainer: {
    position: 'relative',
    width: 361,
    height: 360,
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  posterImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F2',
  },
  movieInfoContainer: {
    width: 361,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginTop: 25,
    gap: 9,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movieTitle: {
    fontSize: 20,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: COLORS.text,
  },
  // Release year and runtime in the same row as rating
  releaseInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  releaseInfo: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
  },
  reviewStars: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'right',
  },
  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
  },
  ageRating: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
    marginRight: 5,
  },
  genreTag: {
    minHeight: 28,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  genreText: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
  },
  detailsContainer: {
    width: 361,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginTop: 24,
    paddingBottom: 200,
    gap: 16,
  },
  releaseYear: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'right',
  },
  synopsis: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20,
  },
  castSection: {
    marginBottom: 16,
  },
  castRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  castItem: {
    width: 80,
    alignItems: 'center',
    marginBottom: 10,
  },
  castImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.cardBackground,
    marginBottom: 6,
  },
  castName: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
  },
  crewSection: {
    marginTop: 12,
  },
  crewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  crewItem: {
    width: 80,
    marginRight: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  crewImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
  },
  crewName: {
    textAlign: 'center',
    fontSize: 12,
    color: '#F7F9FA',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  crewRole: {
    textAlign: 'center',
    fontSize: 11,
    color: '#FEBD69',
    fontFamily: 'Inter',
    fontWeight: '400',
    marginTop: 2,
  },
  castInfo: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
  },
  directorsInfo: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
  },
  producersInfo: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
  },
  writersInfo: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
  },
  showTimesButton: {
    width: 329,
    height: 40,
    backgroundColor: COLORS.accentColor,
    borderRadius: BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 26,
    marginBottom: 16,
  },
  showTimesButtonText: {
    color: COLORS.cardBackground,
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.text,
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.errorColor,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  actionButton: {
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: COLORS.accentColor,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  distributorsContainer: {
    marginTop: 8,
    paddingHorizontal: 6,
  },
  distributorText: {
    fontSize: 14,
    color: '#F7F9FA',
    fontFamily: 'Inter',
    fontWeight: '400',
    marginBottom: 6,
  },
}); 