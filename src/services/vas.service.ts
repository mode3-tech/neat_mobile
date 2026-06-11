import type {
  BuyAirtimePayload,
  VasBiller,
  VasCategory,
  VasProduct,
} from '@/types/vas.types';
import type { ApiEnvelope } from '@/types/api.types';
import { api, throwApiError } from './api';

export const vasService = {
  getCategories: async (): Promise<VasCategory[]> => {
    try {
      const response = await api.get<ApiEnvelope<VasCategory[]>>('/vas/categories');
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to load services');
    }
  },

  getBillers: async (categoryId: number): Promise<VasBiller[]> => {
    try {
      const response = await api.get<ApiEnvelope<VasBiller[]>>('/vas/billers', {
        params: { category_id: categoryId, page: 1, size: 20 },
      });
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to load providers');
    }
  },

  getProducts: async (
    categoryId: number,
    billerId: number,
  ): Promise<VasProduct[]> => {
    try {
      const response = await api.get<ApiEnvelope<VasProduct[]>>('/vas/products', {
        params: { category_id: categoryId, biller_id: billerId, page: 1, size: 10 },
      });
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to load products');
    }
  },

  buyAirtime: async (payload: BuyAirtimePayload): Promise<{ message: string }> => {
    try {
      const response = await api.post<ApiEnvelope<unknown>>('/vas/airtime', payload);
      return { message: response.data.message };
    } catch (error) {
      throwApiError(error, 'Airtime purchase failed. Please try again.');
    }
  },
};
