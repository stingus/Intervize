import axiosInstance from '../utils/axios';
import type { User, ApiResponse } from '../types';

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await axiosInstance.get<ApiResponse<User[]>>('/users');
    return response.data.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await axiosInstance.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const response = await axiosInstance.post<ApiResponse<User>>('/users', data);
    return response.data.data;
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await axiosInstance.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  async deleteUser(id: string): Promise<void> {
    await axiosInstance.delete(`/users/${id}`);
  },

  async getCurrentUserProfile(): Promise<User> {
    const response = await axiosInstance.get<ApiResponse<User>>('/users/me');
    return response.data.data;
  },

  async updateCurrentUserProfile(data: Partial<User>): Promise<User> {
    const response = await axiosInstance.put<ApiResponse<User>>('/users/me', data);
    return response.data.data;
  },
};
