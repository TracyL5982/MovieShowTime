import { StyleSheet } from 'react-native';
import { COLORS as AppColors } from './colors';

const COLORS = {
  background: AppColors.gunmetal, // Amazon Gunmetal
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
  // Header
  header: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#F7F9FA',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  // Cinema image container
  cinemaImageContainer: {
    width: '100%',
    height: 220,
    marginBottom: 16,
  },
  cinemaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  // Cinema info container
  cinemaInfoContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cinemaName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  locationIcon: {
    marginRight: 5,
  },
  distanceText: {
    fontSize: 14,
    color: '#FEBD69',
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cityText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  addressText: {
    fontSize: 15,
    color: '#E0E0E0',
    marginTop: 8,
  },
  phoneText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
  },
  // Movies section
  moviesContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  moviesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  posterScroll: {
    marginBottom: 24,
  },
  posterContainer: {
    width: 120,
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 12,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  nextArrowContainer: {
    width: 40,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Show times button
  showTimesButton: {
    backgroundColor: '#FEBD69',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  showTimesButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141414',
  },
  loadingText: {
    color: '#F7F9FA',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141414',
    padding: 16,
  },
  errorText: {
    color: '#FF5252',
    marginBottom: 24,
    fontSize: 16,
    textAlign: 'center',
  },
  backButtonText: {
    color: '#FEBD69',
    fontSize: 16,
  },
  // New styles for cinema details updates
  descriptionSection: {
    marginTop: 10, 
    marginBottom: 20
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FEBD69',
    marginBottom: 8
  },
  descriptionText: {
    fontSize: 15,
    color: '#E0E0E0',
    lineHeight: 22,
    marginBottom: 20,
  },
  websiteContainer: {
    marginTop: 10,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  websiteButton: {
    backgroundColor: COLORS.accentColor, // Amazon Apricot color
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  websiteIcon: {
    marginRight: 8,
  },
  websiteButtonText: {
    color: '#000000', // Black text for better contrast on apricot
    fontSize: 14,
    fontWeight: '600',
  },
}); 