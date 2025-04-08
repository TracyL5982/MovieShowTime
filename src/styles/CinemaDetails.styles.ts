import { StyleSheet } from 'react-native';

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
  // Header
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
  contentContainer: {
    width: '100%',
    paddingBottom: 220,
    alignItems: 'center',
  },
  // Cinema image container
  cinemaImageContainer: {
    position: 'relative',
    width: 361,
    height: 328,
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  cinemaImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F2',
  },
  // Cinema info container
  cinemaInfoContainer: {
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
  cinemaName: {
    fontSize: 20,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: COLORS.text,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'right',
  },
  addressText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
  },
  phoneText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
  },
  // Movies section
  moviesContainer: {
    width: 361,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginTop: 35,
    gap: 16,
  },
  moviesTitle: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 15,
  },
  posterScroll: {
    marginBottom: 30,
  },
  posterContainer: {
    width: 40,
    height: 40,
    borderRadius: 5,
    marginRight: 12,
    overflow: 'hidden',
  },
  posterImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F2',
  },
  nextArrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  // Show times button
  showTimesButton: {
    width: 329,
    height: 40,
    backgroundColor: COLORS.accentColor,
    borderRadius: BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  showTimesButtonText: {
    color: 'black',
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  // Loading and error states
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
  backButtonText: {
    color: COLORS.accentColor,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
}); 