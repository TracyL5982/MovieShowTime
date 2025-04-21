// API Keys configuration file - EXAMPLE TEMPLATE
// Copy this file to apiKeys.ts and fill in your actual API keys

// OpenAI API Key
export const OPENAI_API_KEY = 'your-openai-api-key-here';

// TMDB API Key
export const TMDB_API_KEY = 'your-tmdb-api-key-here';

// OpenAI configuration object
export const OPENAI_CONFIG = {
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
};

// Instructions for developers:
// 1. Copy this file and rename it to apiKeys.ts
// 2. Replace the placeholder values with your actual API keys
// 3. Never commit your actual apiKeys.ts file to version control
// 4. The apiKeys.ts file is included in .gitignore to prevent accidental commits 