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
  // Set this to Environment.PRODUCTION to use production API
  // Set this to Environment.LOCAL to use localhost API
  return Environment.LOCAL; // Default to local for development
};

// Get the current API base URL based on environment
export const getApiBaseUrl = (): string => {
  const currentEnv = getCurrentEnvironment();
  return API_BASE_URLS[currentEnv];
};

export default getApiBaseUrl; 