import axiosInstance from '../utils/axios';
import type { LoginCredentials, AuthUser, User, ApiResponse } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await axiosInstance.post<ApiResponse<AuthUser>>('/auth/login', credentials);
    const { user, accessToken, refreshToken } = response.data.data;

    // Store tokens and user in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data.data;
  },

  async logout(): Promise<void> {
    try {
      await axiosInstance.post('/auth/logout');
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await axiosInstance.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await axiosInstance.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await axiosInstance.post('/auth/reset-password', { token, newPassword });
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },
};
