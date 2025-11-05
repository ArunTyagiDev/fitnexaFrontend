// Dynamic API URL configuration
const getApiBaseUrl = () => {
  // Check for explicit environment variable first
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  // Default to the provided production API for all environments unless overridden by Vite env
  return 'https://api.aruntyagi.com/api';
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
