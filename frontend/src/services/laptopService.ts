import axiosInstance from '../utils/axios';
import type { Laptop, ApiResponse, Checkout } from '../types';

export const laptopService = {
  async getLaptops(): Promise<Laptop[]> {
    const response = await axiosInstance.get<ApiResponse<Laptop[]>>('/laptops');
    return response.data.data;
  },

  async getLaptopById(id: string): Promise<Laptop> {
    const response = await axiosInstance.get<ApiResponse<Laptop>>(`/laptops/${id}`);
    return response.data.data;
  },

  async getLaptopByUniqueId(uniqueId: string): Promise<Laptop> {
    const response = await axiosInstance.get<ApiResponse<Laptop>>(`/laptops/unique/${uniqueId}`);
    return response.data.data;
  },

  async createLaptop(data: Omit<Laptop, 'id' | 'uniqueId' | 'createdAt' | 'updatedAt'>): Promise<Laptop> {
    const response = await axiosInstance.post<ApiResponse<Laptop>>('/laptops', data);
    return response.data.data;
  },

  async updateLaptop(id: string, data: Partial<Laptop>): Promise<Laptop> {
    const response = await axiosInstance.put<ApiResponse<Laptop>>(`/laptops/${id}`, data);
    return response.data.data;
  },

  async deleteLaptop(id: string): Promise<void> {
    await axiosInstance.delete(`/laptops/${id}`);
  },

  async getLaptopHistory(id: string): Promise<Checkout[]> {
    const response = await axiosInstance.get<ApiResponse<Checkout[]>>(`/laptops/${id}/history`);
    return response.data.data;
  },

  async downloadQRCode(id: string): Promise<Blob> {
    const response = await axiosInstance.get(`/laptops/${id}/qr-code`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
