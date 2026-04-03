import axios from 'axios';

// Create an axios instance with a base URL
// from environment variable or fallback to localhost
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

// Before every request, check if a token exists in localStorage
// and attach it to the Authorization header (Bearer token)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config; // Always return config to proceed with the request
});

export default api; // Export for use across the app