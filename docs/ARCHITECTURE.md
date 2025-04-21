# MovieShowTime Architecture

This document outlines the technical architecture and design decisions behind the MovieShowTime mobile application.

## Application Structure

```
src/
├── components/          # Reusable UI components
├── config/              # Configuration files and API keys
├── screens/             # Main application screens
├── services/            # API and data services
├── store/               # Redux state management 
├── styles/              # Styling constants and theme
└── utils/               # Helper functions and utilities
```

## Core Technologies

- **React Native & Expo**: Cross-platform mobile development
- **Redux**: Centralized state management
- **OpenAI API**: AI-powered conversation and movie data retrieval
- **TMDB API**: Movie metadata, images, and basic information
- **React Navigation**: Screen navigation and routing

## Data Flow

1. **User Interface** → Triggers actions (search, select, navigate)
2. **Actions** → Dispatched to Redux or direct service calls
3. **Services** → Makes API calls to external providers
4. **State Updates** → Redux updates application state
5. **UI Rendering** → Components respond to state changes

## Key Components

### AI Chat System

The AI chat system is a core feature that provides:
- Natural language understanding
- Context-aware responses
- Web search capability for real-time data
- Voice input and text-to-speech output

#### Implementation Details:
- Uses OpenAI's GPT-4o model
- Maintains conversation history in Redux store
- Dynamically adjusts UI height based on chat interaction
- Integrates with voice recognition and speech synthesis

### Movie Showtime Search

The showtime search system:
- Retrieves showtimes for movies at nearby theaters
- Handles date-based queries
- Formats and parses AI responses into structured data

#### Implementation Details:
- Combines user location data with movie information
- Custom date handling to manage timezone issues
- Parsing functions to extract structured data from AI responses
- Fallback mechanisms for handling unusual response formats

### Location Services

Location features provide:
- User location detection
- Distance calculation to theaters
- Geocoding for address-based searches

#### Implementation Details:
- Uses Expo Location API
- Calculates distances using haversine formula
- Maintains default location when permissions are denied

## Screens and Navigation

The application uses a stack-based navigation model:

```
StartScreen
├── MovieGallery
│   └── MovieDetails
│       └── MovieShowtime
└── CinemaGallery
    └── CinemaDetails
```

Each screen maintains its own state while accessing global state through Redux.

## State Management

The Redux store is organized into slices:

- **movies**: Movie data, search results, and loading states
- **cinemas**: Theater information and location data
- **ai**: AI chat state, message history, and UI dimensions
- **user**: User preferences and settings

## API Integration

### OpenAI Integration

- **Purpose**: Powers the AI chat and showtime search
- **Key Features**:
  - Web search capability for real-time data
  - Natural language processing
  - Structured response parsing

### TMDB Integration

- **Purpose**: Provides movie data and images
- **Key Features**:
  - Movie search and details
  - Cast and crew information
  - Poster and backdrop images

## Accessibility

Accessibility features are integrated throughout the application:

- **Voice Input**: Recognition system for hands-free operation
- **Text-to-Speech**: Converts AI responses to spoken audio
- **Color Contrast**: Designed for readability
- **Screen Reader Support**: Compatible with assistive technologies

## Performance Considerations

- **Pagination**: Implemented for large data sets
- **Image Optimization**: Proper sizing and lazy loading
- **Caching**: Local storage of frequently accessed data
- **Throttling**: Rate limiting for API calls

## Testing Strategy

- **Unit Tests**: Individual function testing
- **Component Tests**: Isolated UI component testing
- **Integration Tests**: Combined feature testing
- **E2E Tests**: Full application flow testing

## Future Improvements

- Expanded theater coverage
- Seat selection and ticket purchasing
- User accounts and favorites
- Personalized recommendations based on viewing history
- Additional accessibility enhancements 