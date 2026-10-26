import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach Bearer token
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore localStorage access failures (e.g. private mode restrictions)
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to unwrap envelope and handle 401
api.interceptors.response.use(
  (response) => {
    // If backend returns standard { success: true, data }, unwrap data
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data;
    }
    return response.data;
  },
  (error) => {
    if (error.response) {
      // If 401 Unauthorized, clear stored token and user data
      if (error.response.status === 401) {
        try {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        } catch {
          // ignore
        }
        // Redirect to login if not already on login/register/public page
        const publicPaths = ['/login', '/register', '/', '/courses'];
        if (!publicPaths.some((path) => window.location.pathname.startsWith(path))) {
          window.location.href = '/login';
        }
      }

      // Return server formatted error if available
      const serverError = error.response.data;
      if (serverError && typeof serverError === 'object' && serverError.message) {
        return Promise.reject(new Error(serverError.message));
      }
    }

    return Promise.reject(
      new Error(error.message || 'A network error occurred. Please try again.')
    );
  }
);

export default api;
