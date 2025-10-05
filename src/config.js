// API URL Configuration - Hardcoded to server
// Local development: http://localhost:8000/api
// Production server: http://shrijigroup.co.in/public/api

export const API_BASE_URL = 'http://shrijigroup.co.in/public/api';

// Environment info for debugging
export const ENV_INFO = {
  apiUrl: API_BASE_URL,
  hostname: window.location.hostname,
  fullUrl: window.location.href
};

// Log configuration for debugging
console.log('API Configuration:', ENV_INFO);
