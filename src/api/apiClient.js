import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Create detailed error object
    const errorObj = {
      status,
      message: data?.error || error.message || 'An error occurred',
      code: data?.code,
      details: data?.details,
      originalError: error
    };

    // Handle specific status codes
    if (status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
    } else if (status === 403) {
      errorObj.message = 'You do not have permission to perform this action';
    } else if (status === 404) {
      errorObj.message = 'Resource not found';
    } else if (status === 400) {
      errorObj.message = data?.error || 'Invalid request data';
    } else if (status === 500) {
      errorObj.message = 'Server error. Please try again later';
    } else if (!status) {
      errorObj.message = 'Network error. Please check your connection';
    }

    return Promise.reject(errorObj);
  }
);


// Add request timeout
apiClient.defaults.timeout = 30000; // 30 seconds

export default apiClient;
