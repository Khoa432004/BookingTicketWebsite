// Environment configuration file
// This file provides environment-specific configuration values

// Define available environments
export enum Environment {
  LOCAL = 'local',
  PRODUCTION = 'production',
  VERCEL = 'vercel',
  RENDER = 'render'
}

// Define API base URLs for each environment
export const API_BASE_URLS = {
  [Environment.LOCAL]: 'http://localhost:8080',
  [Environment.PRODUCTION]: 'https://bookingticketwebsite.onrender.com',
  // Trỏ thẳng đến backend trên Render
  [Environment.VERCEL]: 'https://bookingticketwebsite.onrender.com',
  // Render environment
  [Environment.RENDER]: 'https://bookingticketwebsite.onrender.com'
};

// Get current environment
export const getCurrentEnvironment = (): Environment => {
  // Auto-detect environment based on hostname
  if (typeof window !== 'undefined') {
    // Check if we're running on localhost
    if (window.location.hostname === 'localhost') {
      console.log('Detected environment: LOCAL');
      return Environment.LOCAL;
    }
    // Check if we're running on Render
    if (window.location.hostname.includes('onrender.com')) {
      console.log('Detected environment: RENDER');
      return Environment.RENDER;
    }
    // Check if we're running on Vercel
    if (window.location.hostname.includes('vercel.app')) {
      console.log('Detected environment: VERCEL');
      return Environment.VERCEL;
    }
    // Any other hostname is considered production
    console.log('Detected environment: PRODUCTION');
    return Environment.PRODUCTION;
  }
  
  // Default to production for SSR
  console.log('Default environment for SSR: PRODUCTION');
  return Environment.PRODUCTION;
};

// Get the current API base URL based on environment
export const getApiBaseUrl = (): string => {
  const currentEnv = getCurrentEnvironment();
  const baseUrl = API_BASE_URLS[currentEnv];
  console.log('Using API base URL:', baseUrl);
  return baseUrl;
};

export default getApiBaseUrl;