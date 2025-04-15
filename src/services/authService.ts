import api from '@/lib/api';
import { LoginRequest, LoginResponse, ApiResponse } from '@/lib/types';

const AUTH_API = 'http://localhost:8080/api/v1/auth';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>(`${AUTH_API}/login`, credentials);
      console.log('Login response:', response.data);
      
      if (response.data.accessToken) {
        // Store token and user data
        localStorage.setItem('access-token', response.data.accessToken);
        localStorage.setItem('refresh-token', response.data.refreshToken);
        
        // Map the response data to our User type
        const userData = {
          id: response.data.data.userId,
          username: response.data.data.userName,
          phoneNumber: response.data.data.phoneNumber,
          countryCode: response.data.data.countryCode
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        return response.data;
      }
      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  logout: () => {
    // Clear all auth-related data
    localStorage.removeItem('access-token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr || userStr === 'undefined') {
        console.log('No user data found in localStorage');
        return null;
      }
      const user = JSON.parse(userStr);
      if (!user || typeof user !== 'object') {
        console.log('Invalid user data format');
        return null;
      }
      return user;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },
  
  isAuthenticated: () => {
    const token = localStorage.getItem('access-token');
    const user = authService.getCurrentUser();
    return !!token && !!user;
  },

  getToken: () => {
    return localStorage.getItem('access-token');
  }
};
