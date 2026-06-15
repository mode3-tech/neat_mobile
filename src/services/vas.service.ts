import type {
  BuyAirtimePayload,
  BuyDataPayload,
  VasBiller,
  VasCategory,
  VasProduct,
} from '@/types/vas.types';
import type { ApiEnvelope, PaginatedApiEnvelope } from '@/types/api.types';
import { api, throwApiError } from './api';

// Runaway guard for the fetch-all loop; biller catalogues are small.
const MAX_PRODUCT_PAGES = 10;

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

  /**
   * Fetch every product page for a biller (data plans are paginated —
   * e.g. GLO has 33 plans across 4 pages of 10).
   */
  getAllProducts: async (
    categoryId: number,
    billerId: number,
  ): Promise<VasProduct[]> => {
    try {
      const products: VasProduct[] = [];
      let page = 1;
      let hasNext = true;
      while (hasNext && page <= MAX_PRODUCT_PAGES) {
        const response = await api.get<PaginatedApiEnvelope<VasProduct>>(
          '/vas/products',
          { params: { category_id: categoryId, biller_id: billerId, page, size: 50 } },
        );
        // `data` can be null for a biller with no products — treat as empty,
        // not an error, so the UI shows its empty state instead of Retry.
        products.push(...(response.data.data ?? []));
        hasNext = response.data.has_next;
        page += 1;
      }
      return products;
    } catch (error) {
      throwApiError(error, 'Failed to load data plans');
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

  buyData: async (payload: BuyDataPayload): Promise<{ message: string }> => {
    try {
      const response = await api.post<ApiEnvelope<unknown>>('/vas/data', payload);
      return { message: response.data.message };
    } catch (error) {
      throwApiError(error, 'Data purchase failed. Please try again.');
    }
  },
};
