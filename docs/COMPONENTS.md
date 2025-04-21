# UI Components

This document provides details about the key UI components used throughout the MovieShowTime application.

## Navigation Components

### NavigationHeader
A consistent header component used across all screens with:
- Back button
- Title text
- Optional right-side actions
- Customizable background color

## Input Components

### CustomSearchBar
Advanced search input with:
- Voice input capability
- Autocomplete suggestions
- Clear button
- Search history integration

### AIChatBox
Expandable chat interface that:
- Docks at the bottom of the screen
- Expands when active
- Supports text and voice input
- Animated transitions

## Movie Components

### MovieCard
Displays movie information in a card format:
- Poster image with fallback
- Title and rating
- Release year
- Optional genre badges

### MovieList
Scrollable list of movies with:
- Horizontal or grid layout options
- Pull-to-refresh
- Progressive loading
- Empty state handling

### MovieDetails
Comprehensive movie information display:
- Hero image with title overlay
- Description and metadata
- Cast and crew information
- Related actions (view showtimes, watch trailer)

## Cinema Components

### CinemaCard
Displays theater information:
- Name and logo
- Distance from user
- Address preview
- Now playing indicator

### CinemaShowtimes
Displays movie showtimes for a specific cinema:
- Date selection
- Movie filtering
- Time slots with format indicators
- Price information when available

## Date & Time Components

### DateSelector
Horizontally scrollable date picker:
- Displays day of week and date
- Highlights current date
- Visual indication of selected date
- Custom date formatting

### ShowtimeSlots
Displays available showtimes:
- Grouped by format (IMAX, 3D, Standard)
- Time formatting
- Visual distinction for premium formats
- Booking availability indicators

## Feedback Components

### LoadingIndicator
Standardized loading states:
- Full-screen loading
- Inline content loading
- Skeletal loading for content
- Branded animation

### ErrorDisplay
Handles error states with:
- User-friendly messages
- Retry actions
- Fallback content
- Error reporting

## Accessibility Components

### AudioHandler
Manages speech input and output:
- Voice recording UI
- Audio playback controls
- Text-to-speech integration
- Audio feedback indicators

### VoiceCommandButton
Floating action button for voice input:
- Activation indicator
- Listening state animation
- Voice command feedback
- Accessibility labels

## State Components

### EmptyState
Displays when content is unavailable:
- Contextual messaging
- Suggested actions
- Branded illustrations
- Clear explanation of why content is missing

### NoResultsView
Specialized empty state for search results:
- Search term echo
- Alternative search suggestions
- Clear guidance on next steps
- Option to browse popular content instead 