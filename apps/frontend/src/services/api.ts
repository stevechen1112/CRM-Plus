import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing token to avoid multiple refresh calls
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Function to add request to queue while refreshing
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Function to execute queued requests after refresh
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && originalRequest && !originalRequest.url?.includes('/auth/login')) {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken && !isRefreshing) {
        isRefreshing = true;
        
        try {
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          if (refreshResponse.data.success) {
            const newAccessToken = refreshResponse.data.data.accessToken;
            localStorage.setItem('accessToken', newAccessToken);
            
            // Update authorization header for the original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            
            // Notify all subscribers with new token
            onTokenRefreshed(newAccessToken);
            
            isRefreshing = false;
            
            // Retry the original request
            return apiClient(originalRequest);
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (refreshError) {
          isRefreshing = false;
          
          // Clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            toast.error('登入已過期，請重新登入');
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        }
      } else if (refreshToken && isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      } else {
        // No refresh token available, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        if (!window.location.pathname.includes('/login')) {
          toast.error('請先登入');
          window.location.href = '/login';
        }
      }
    }
    
    // Handle other errors
    else if (error.response?.status === 403) {
      toast.error('您沒有權限執行此操作');
    } else if (error.response?.status && error.response.status >= 500) {
      toast.error('服務器錯誤，請稍後再試');
    } else if (error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
      if (!error.config?.url?.includes('/auth/login')) {
        toast.error(error.response.data.message as string);
      }
    } else if (error.message === 'Network Error') {
      toast.error('網路連接錯誤，請檢查網路設定');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('請求超時，請稍後再試');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;