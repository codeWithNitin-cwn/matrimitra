import axios from 'axios';
import { useAuthStore } from '@/modules/auth/auth.store';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration or invalidation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the error is 401 Unauthorized, the token is invalid or expired
    if (error.response && error.response.status === 401) {
      const { logout } = useAuthStore.getState();
      logout();
      // Ensure we are in the browser environment before redirecting
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;