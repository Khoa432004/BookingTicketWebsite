// Environment configuration file
// This file provides environment-specific configuration values

// Define available environments
export enum Environment {
  LOCAL = 'local',
  PRODUCTION = 'production'
}

// Define API base URLs for each environment
export const API_BASE_URLS = {
  [Environment.LOCAL]: 'http://localhost:8080/api',
  [Environment.PRODUCTION]: 'https://bookingticketwebsite.onrender.com/api'
};

// Get current environment
export const getCurrentEnvironment = (): Environment => {
  // Auto-detect environment based on hostname
  if (typeof window !== 'undefined') {
    // Check if we're running on localhost
    if (window.location.hostname === 'localhost') {
      return Environment.LOCAL;
    }
    // Any other hostname is considered production
    return Environment.PRODUCTION;
  }
  
  // Default to production for SSR
  return Environment.PRODUCTION;
};

// Get the current API base URL based on environment
export const getApiBaseUrl = (): string => {
  const currentEnv = getCurrentEnvironment();
  return API_BASE_URLS[currentEnv];
};

export default getApiBaseUrl; 