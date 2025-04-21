# Services Architecture

This document outlines the services layer of the MovieShowTime application, which handles data fetching, API integration, and business logic.

## Overview

The services layer is designed around several key responsibilities:
- Abstracting external API calls
- Providing consistent data structures
- Handling errors and fallbacks
- Managing application state
- Processing complex data transformations

## Service Modules

### MovieShowtimeAPI

This is the main service object exported from `movieShowtimeSearch.ts` that combines:
- AI-powered showtime retrieval
- Processing of showtime data
- Structured data formatting

Key functions:
- `getAIShowtimesForMovie`: Retrieves and formats showtimes for a specific movie
- `getAIShowtimesForCinema`: Retrieves showtimes for all movies at a specific cinema
- `parseAIShowtimeResponse`: Converts raw AI responses into structured data

### TMDB Service

Located in `tmdb.ts`, this service handles interactions with The Movie Database API:
- Movie search and discovery
- Movie details and metadata
- Image URLs and configuration
- Cast and crew information

Key functions:
- `fetchNowPlayingMovies`: Retrieves currently playing movies
- `searchMovies`: Searches for movies by title
- `fetchMovieDetails`: Gets comprehensive details for a specific movie

### Cinema Service

Located in `cinema.ts`, this service manages theater data:
- Nearby cinema discovery
- Cinema details and location
- Mapping between external IDs and internal representations

Key functions:
- `getNearbyCinemas`: Finds theaters near the user's location
- `getCinemaById`: Retrieves detailed information about a specific cinema
- `getShowtimesForCinema`: Gets all showtimes for a particular theater

### Location Service

Located in `location.ts`, this service handles geolocation functions:
- User location detection
- Distance calculations
- Geocoding and reverse geocoding
- Location permissions management

Key functions:
- `getCurrentLocation`: Gets the user's current coordinates
- `calculateDistance`: Computes the distance between two points
- `geocodeAddress`: Converts addresses to coordinates

## Data Processing

### Response Parsing

The application employs several strategies for parsing AI responses:

- `extractTextFromResponse`: Extracts raw text from different API response formats
- `parseAIShowtimeResponse`: Converts text to structured data objects
- `fallbackParseAIShowtimeResponse`: Alternative parser for handling edge cases

### Date Handling

Custom date handling is implemented to ensure consistent behavior across timezones:

- `formatDateString`: Formats dates without timezone conversion issues
- Custom date validation to prevent invalid searches
- Date range utilities for showing upcoming showtimes

## OpenAI Integration

The application uses OpenAI for several key features:

### Showtime Search

- Constructs detailed prompts for showtime retrieval
- Utilizes web search capabilities to find current data
- Implements parsing logic for structured and unstructured responses

### Conversational AI

- Manages message history and context
- Provides natural language understanding
- Handles multi-turn conversations

## Error Handling

The services layer implements comprehensive error handling:

- Graceful degradation when APIs are unavailable
- Fallback content when data cannot be retrieved
- Intelligent retry strategies
- User-friendly error messages

## Caching Strategy

To improve performance and reduce API calls:

- In-memory caching for frequently accessed data
- TTL (Time-To-Live) for time-sensitive data like showtimes
- Cache invalidation based on context changes

## Extensibility

The services architecture is designed for extensibility:

- Service interfaces that can be swapped for alternative implementations
- Mock services for testing and development
- Service composition for combining multiple data sources 