// Dynamic API URL configuration
const getApiBaseUrl = () => {
  // Check for explicit environment variable first
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Check if we're in production environment
  const hostname = window.location.hostname;
  const isProduction = import.meta.env.PROD || 
                      hostname === 'shrijigroup.co.in' ||
                      hostname.includes('shrijigroup.co.in') ||
                      hostname === 'fitnexa.vercel.app' ||
                      hostname.includes('vercel.app') ||
                      hostname.includes('netlify.app') ||
                      hostname.includes('herokuapp.com') ||
                      hostname !== 'localhost' && !hostname.includes('127.0.0.1') && !hostname.includes('192.168.');
  
  // Default URLs based on environment
  if (isProduction) {
    return 'https://shrijigroup.co.in/public/api';
  } else {
    return 'http://localhost:8000/api';
  }
};

export const API_BASE_URL = getApiBaseUrl();

// Environment info for debugging
export const ENV_INFO = {
  isProduction: import.meta.env.PROD,
  hostname: window.location.hostname,
  apiUrl: API_BASE_URL,
  viteEnv: import.meta.env.VITE_API_BASE_URL,
  isVercel: window.location.hostname.includes('vercel.app'),
  isNetlify: window.location.hostname.includes('netlify.app'),
  isLocal: window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1'),
  fullUrl: window.location.href
};

// Log configuration for debugging
console.log('API Configuration:', ENV_INFO);
