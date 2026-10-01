import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to dynamically inject the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle standard API errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.message || 'An unexpected error occurred.';

      switch (status) {
        case 401:
          // Unauthorized / Token expired: clear local storage if not already on login page
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login?expired=true';
          }
          break;

        case 403:
          console.warn('RBAC Access Denied: 403 Forbidden', errorMessage);
          break;

        case 404:
          // In multi-tenant systems, 404 is commonly returned for resources belonging to other tenants
          console.info('Resource Not Found or Tenant Mismatch (404):', errorMessage);
          break;

        case 500:
          console.error('Server Internal Error (500):', errorMessage);
          break;

        default:
          break;
      }

      // Attach extracted message for components to display easily
      error.friendlyMessage = errorMessage;
    } else if (error.request) {
      error.friendlyMessage = 'Unable to connect to server. Please verify backend API is running.';
    } else {
      error.friendlyMessage = error.message;
    }

    return Promise.reject(error);
  }
);

export default api;
