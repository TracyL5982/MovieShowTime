import { formatStructuredCinemaResponse } from './OpenAIService';

/**
 * Handles navigation to Cinema Gallery screen
 */
const handleCinemaGalleryNavigation = async (
  responseText: string,
  navigation: any,
  userLocation: any
) => {
  if (!responseText.includes('cinema') && !responseText.includes('theater') && 
      !responseText.includes('theatre')) {
    console.log('Response does not contain cinema information, staying on current screen');
    return;
  }
  
  try {
    // Format the response for display
    const formattedResponse = formatStructuredCinemaResponse(responseText);
    
    navigation.navigate('CinemaGallery', { 
      responseText: formattedResponse,
      userLocation: userLocation
    });
  } catch (error) {
    console.error('Error navigating to cinema gallery:', error);
  }
};

// Export the function
export { handleCinemaGalleryNavigation };