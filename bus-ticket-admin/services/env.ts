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
  [Environment.LOCAL]: 'http://localhost:8080/api',
  [Environment.PRODUCTION]: 'https://bookingticketwebsite.onrender.com/api',
  // Use the Next.js API route to proxy requests
  [Environment.VERCEL]: '/api/proxy/api',
  // Render environment
  [Environment.RENDER]: 'https://bookingticketwebsite.onrender.com/api'
};

// Get current environment
export const getCurrentEnvironment = (): Environment => {
  // Auto-detect environment based on hostname
  if (typeof window !== 'undefined') {
    // Check if we're running on localhost
    if (window.location.hostname === 'localhost') {
      return Environment.LOCAL;
    }
    // Check if we're running on Render
    if (window.location.hostname.includes('onrender.com')) {
      return Environment.RENDER;
    }
    // Check if we're running on Vercel
    if (window.location.hostname.includes('vercel.app')) {
      return Environment.VERCEL;
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
  console.log('Current environment (bus-ticket-admin):', currentEnv);
  const baseUrl = API_BASE_URLS[currentEnv];
  console.log('Using API base URL:', baseUrl);
  return baseUrl;
};

export default getApiBaseUrl; 