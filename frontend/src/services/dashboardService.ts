import axiosInstance from '../utils/axios';
import type { DashboardSummary, Checkout, LostFoundEvent, ApiResponse } from '../types';

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await axiosInstance.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return response.data.data;
  },

  async getActiveCheckouts(): Promise<Checkout[]> {
    const response = await axiosInstance.get<ApiResponse<Checkout[]>>('/dashboard/active-checkouts');
    return response.data.data;
  },

  async getOverdueCheckouts(): Promise<Checkout[]> {
    const response = await axiosInstance.get<ApiResponse<Checkout[]>>('/dashboard/overdue');
    return response.data.data;
  },

  async getLostFoundEvents(): Promise<LostFoundEvent[]> {
    const response = await axiosInstance.get<ApiResponse<LostFoundEvent[]>>('/dashboard/lost-found');
    return response.data.data;
  },
};
