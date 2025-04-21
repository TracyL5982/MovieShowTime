import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS, FONTS, FONT_SIZES, FONT_WEIGHTS, SPACING } from './theme';

const EXTENDED_COLORS = {
  ...COLORS,
  transparentWhite: 'rgba(255, 255, 255, 0.8)', 
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gunmetal, 
    position: 'relative',
  },
  backgroundGradient: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    paddingHorizontal: SPACING.medium,
    paddingBottom: 100, 
  },
  titleContainer: {
    paddingVertical: 16,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  promptsContainer: {
    width: '100%',
    marginTop: SPACING.medium,
    flexDirection: 'column',
    gap: SPACING.medium,
  },
  promptCard: {
    width: '100%',
    backgroundColor: COLORS.eerieBlack,
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    ...SHADOWS.large,
    marginBottom: SPACING.medium,
    padding: SPACING.medium, 
  },
  promptCardContent: {
    width: '100%',
    flexDirection: 'column',
  },
  promptTextContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  promptText: {
    color: COLORS.offWhite,
    fontSize: FONT_SIZES.medium,
    fontFamily: FONTS.primary,
    fontWeight: FONT_WEIGHTS.regular,
    flex: 1,
    paddingRight: 20,
  },
  chevronIcon: {
    paddingLeft: 20,
  },
  iconsContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.platinumGray,
  },
  posterImage: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.small,
  },
  forwardIcon: {
    width: 16,
    height: 25,
  },
  chatBoxContainer: {
    width: '100%',
    height: 53,
    position: 'absolute',
    bottom: 55,
    backgroundColor: COLORS.pureWhite,
    borderRadius: RADIUS.medium,
    ...SHADOWS.large,
  },
  chatInputContainer: {
    width: '100%',
    height: '100%',
    paddingHorizontal: SPACING.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatInputText: {
    color: COLORS.silverGray,
    fontSize: FONT_SIZES.regular,
    fontFamily: FONTS.primary,
    fontWeight: FONT_WEIGHTS.regular,
  },
  chatInputIcon: {
    width: 25,
    height: 25,
  },
  loadingContainer: {
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 12,
    margin: SPACING.medium,
    marginTop: 0,
    marginBottom: SPACING.small,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: RADIUS.small,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: FONTS.primaryRegular,
    fontSize: FONT_SIZES.small,
    color: COLORS.alertRed,
    textAlign: 'center',
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 

