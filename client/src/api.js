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
  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sf_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api; // Export for use across the app