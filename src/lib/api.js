import axios from 'axios';
import { API_BASE_URL, ENV_INFO } from '../config';

const api = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000, // 10 second timeout
});

// Request interceptor
api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');
	if (token) config.headers.Authorization = `Bearer ${token}`;
	
	// Log API requests in development
	if (!ENV_INFO.isProduction) {
		console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
	}
	
	return config;
}, (error) => {
	console.error('Request interceptor error:', error);
	return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(
	(response) => {
		// Log successful responses in development
		if (!ENV_INFO.isProduction) {
			console.log(`API Response: ${response.status} ${response.config.url}`);
		}
		return response;
	},
	(error) => {
		// Enhanced error logging
		console.error('API Error:', {
			url: error.config?.url,
			status: error.response?.status,
			message: error.message,
			response: error.response?.data,
			environment: ENV_INFO
		});
		
		// Handle specific error cases
		if (error.response?.status === 401) {
			// Unauthorized - clear token and redirect to login
			localStorage.removeItem('token');
			window.location.href = '/login';
		}
		
		return Promise.reject(error);
	}
);

export default api;
