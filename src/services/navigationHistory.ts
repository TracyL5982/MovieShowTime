import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RouteEntry {
  routeName: string;
  params?: object;
}

// In-memory history state
let history: RouteEntry[] = [];
let index = -1;
const HISTORY_STORAGE_KEY = 'navigation_history';
const DEBUG = true; 

// Debug logging
const debug = (...args: any[]) => {
  if (DEBUG) {
    console.log('[NavHistory]', ...args);
  }
};

// Initialize history from AsyncStorage
const initialize = async (): Promise<void> => {
  try {
    const storedHistory = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (storedHistory) {
      const { savedHistory, savedIndex } = JSON.parse(storedHistory);
      history = savedHistory;
      index = savedIndex;
      debug(`Initialized with ${history.length} entries, current index: ${index}`);
      logHistory();
    }
  } catch (error) {
    console.error('Failed to load navigation history:', error);
    history = [];
    index = -1;
  }
};

// Save history to AsyncStorage
const persistHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify({ savedHistory: history, savedIndex: index })
    );
  } catch (error) {
    console.error('Failed to save navigation history:', error);
  }
};

// Add a new route to history
const addToHistory = (routeName: string, params?: object): void => {
  if (!routeName) {
    debug('Attempted to add undefined route to history');
    return;
  }

  debug(`Adding to history: ${routeName}`);
  
  // Check if we're already at this route (prevent duplicates)
  if (index >= 0 && history[index]?.routeName === routeName) {
    if (params && JSON.stringify(history[index].params) !== JSON.stringify(params)) {
      history[index].params = params;
      persistHistory();
    }
    debug(`Route ${routeName} already at current index ${index}, just updating params`);
    return;
  }
  
  // If we're not at the end, truncate forward history
  if (index < history.length - 1) {
    debug(`Truncating forward history from index ${index} (length was ${history.length})`);
    history = history.slice(0, index + 1);
  }
  
  // Add the new route
  history.push({ routeName, params });
  index = history.length - 1;
  debug(`Added route ${routeName}, new index: ${index}, history length: ${history.length}`);
  
  persistHistory();
  logHistory();
};

// Navigate back in history
const goBack = (): RouteEntry | null => {
  if (!canGoBack()) {
    debug('Cannot go back - at start of history');
    return null;
  }
  
  index--;
  const prevRoute = history[index];
  debug(`Going back to: ${prevRoute.routeName} (index ${index})`);
  persistHistory();
  logHistory();
  return prevRoute;
};

// Navigate forward in history
const goForward = (): RouteEntry | null => {
  if (!canGoForward()) {
    debug('Cannot go forward - at end of history');
    return null;
  }
  
  index++;
  const nextRoute = history[index];
  debug(`Going forward to: ${nextRoute.routeName} (index ${index})`);
  persistHistory();
  logHistory();
  return nextRoute;
};

// Check if back navigation is possible
const canGoBack = (): boolean => {
  return index > 0;
};

// Check if forward navigation is possible
const canGoForward = (): boolean => {
  return index < history.length - 1;
};

// Clear the entire history
const clearHistory = (): void => {
  history = [];
  index = -1;
  persistHistory();
  debug('Navigation history cleared');
};

const getCurrentEntry = (): RouteEntry | null => {
  if (index >= 0 && index < history.length) {
    return history[index];
  }
  return null;
};

const getHistory = (): { history: RouteEntry[], index: number } => {
  return { history, index };
};

const logHistory = (): void => {
  debug('--- Navigation History ---');
  debug(`Total entries: ${history.length}, Current index: ${index}`);
  debug(`Can go back: ${canGoBack()}, Can go forward: ${canGoForward()}`);
  
  if (history.length > 0) {
    debug('History entries:');
    history.forEach((entry, i) => {
      debug(`${i === index ? '→ ' : '  '}[${i}] ${entry.routeName}${entry.params ? ' ' + JSON.stringify(entry.params) : ''}`);
    });
  }
  
  debug('-------------------------');
};

const navigationHistory = {
  initialize,
  addToHistory,
  goBack,
  goForward,
  canGoBack,
  canGoForward,
  clearHistory,
  getCurrentEntry,
  getHistory,
  logHistory
};

export default navigationHistory; 