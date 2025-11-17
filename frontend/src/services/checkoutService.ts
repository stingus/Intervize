import axiosInstance from '../utils/axios';
import type { Checkout, ApiResponse } from '../types';

export interface CreateCheckoutData {
  laptopId: string;
  userId: string;
}

export interface CheckinData {
  laptopUniqueId: string;
}

export interface ReportLostData {
  laptopUniqueId: string;
}

export interface ReportFoundData {
  laptopUniqueId: string;
  finderUserId: string;
}

export const checkoutService = {
  async getCheckouts(): Promise<Checkout[]> {
    const response = await axiosInstance.get<ApiResponse<Checkout[]>>('/checkouts');
    return response.data.data;
  },

  async getActiveCheckouts(): Promise<Checkout[]> {
    const response = await axiosInstance.get<ApiResponse<Checkout[]>>('/checkouts/active');
    return response.data.data;
  },

  async getCurrentUserCheckout(): Promise<Checkout | null> {
    try {
      const response = await axiosInstance.get<ApiResponse<Checkout>>('/checkouts/my-current');
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async createCheckout(data: CreateCheckoutData): Promise<Checkout> {
    const response = await axiosInstance.post<ApiResponse<Checkout>>('/checkouts', data);
    return response.data.data;
  },

  async checkin(checkoutId: string, data: CheckinData): Promise<Checkout> {
    const response = await axiosInstance.post<ApiResponse<Checkout>>(
      `/checkouts/${checkoutId}/checkin`,
      data
    );
    return response.data.data;
  },

  async checkout(data: { laptopUniqueId: string; userId: string }): Promise<Checkout> {
    const response = await axiosInstance.post<ApiResponse<Checkout>>('/checkouts/checkout', data);
    return response.data.data;
  },

  async checkinByUniqueId(data: CheckinData): Promise<Checkout> {
    const response = await axiosInstance.post<ApiResponse<Checkout>>('/checkouts/checkin', data);
    return response.data.data;
  },

  async reportLost(data: ReportLostData): Promise<any> {
    const response = await axiosInstance.post<ApiResponse<any>>('/checkouts/report-lost', data);
    return response.data.data;
  },

  async reportFound(data: ReportFoundData): Promise<any> {
    const response = await axiosInstance.post<ApiResponse<any>>('/checkouts/report-found', data);
    return response.data.data;
  },

  async manualCheckout(data: CreateCheckoutData): Promise<Checkout> {
    const response = await axiosInstance.post<ApiResponse<Checkout>>('/checkouts/manual', data);
    return response.data.data;
  },
};
