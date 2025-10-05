// Dynamic API URL configuration
const getApiBaseUrl = () => {
  // Check if we're in production environment
  const isProduction = import.meta.env.PROD || 
                      window.location.hostname === 'shrijigroup.co.in' ||
                      window.location.hostname.includes('shrijigroup.co.in');
  
  // Check for explicit environment variable
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Default URLs based on environment
  if (isProduction) {
    return 'http://shrijigroup.co.in/public/api';
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
  viteEnv: import.meta.env.VITE_API_BASE_URL
};

// Log configuration for debugging
console.log('API Configuration:', ENV_INFO);
