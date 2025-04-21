# MovieShowTime App

A mobile application that helps users find movie showtimes using AI-powered search and recommendations.

## Features

- **Movie Discovery**: Browse popular movies and search for specific titles
- **Cinema Locator**: Find nearby theaters with distance calculations
- **AI Assistant**: Chat with an AI assistant for personalized recommendations
- **Voice Input**: Speak your queries for hands-free operation
- **Text-to-Speech**: Audio responses for improved accessibility
- **Dynamic Showtimes**: Real-time movie schedules for theaters near you

## Screens

### Start Screen
The app's entry point featuring a welcome message and navigation options to explore movies or theaters.

### Movie Gallery
Displays a grid of movie posters with filtering options:
- Trending/popular movies
- Search results
- Swipe-to-refresh for updated content

### Movie Details
Comprehensive movie information including:
- Synopsis, cast, and crew
- Rating and release information
- One-tap access to showtimes
- Trailer playback

### Movie Showtime
Shows all theaters and times for a selected movie:
- Date selection carousel
- Theater filtering options
- Distance from current location

### Cinema Gallery
Browse theaters near your location:
- Distance-based sorting
- Theater information preview
- Quick access to featured movies

### Cinema Details
Detailed view of a selected theater:
- Address and contact information
- Distance from current location
- Featured movies currently playing
- Link to official website

## Components

### AI Chat Box
An intelligent assistant that:
- Answers questions about movies and showtimes
- Provides recommendations based on preferences
- Handles natural language requests
- Remembers conversation context

### Accessibility Features

#### Voice Input
- Trigger voice recognition with mic icon
- Speech-to-text conversion for hands-free operation
- Natural language processing for understanding queries

#### Text-to-Speech
- Audio output for AI responses
- Adjustable speech rate and volume
- Support for screen readers

## Technical Architecture

### API Integration
- **TMDB**: Movie metadata and images
- **OpenAI**: Conversational AI and web search capabilities
- **Location Services**: Geolocation for finding nearby theaters

### State Management
- Redux for centralized application state
- Persistent storage for user preferences

## Setup Instructions

1. Clone the repository
2. Copy `apiKeys.example.ts` to `apiKeys.ts` and add your API keys:
   - OpenAI API key
   - TMDB API key
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start the development server

## API Keys

The application requires the following API keys:
- **OpenAI API Key**: Powers the AI assistant and showtime search
- **TMDB API Key**: Provides movie data and images

Store your keys in `src/config/apiKeys.ts` (this file is gitignored)
