import type {
  AddBeneficiaryPayload,
  Beneficiary,
  Bank,
  BulkTransferPayload,
  BulkTransferResponse,
  TransferPayload,
  TransferResult,
  ValidatedAccount,
} from '@/types/transfer.types';
import type { ApiEnvelope } from '@/types/api.types';
import { api, throwApiError } from './api';

export const walletService = {
  getBanks: async (): Promise<Bank[]> => {
    try {
      const response = await api.get<ApiEnvelope<Bank[]>>('/wallet/banks');
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to load banks');
    }
  },

  validateAccount: async (
    accountNumber: string,
    bankCode: string,
  ): Promise<ValidatedAccount> => {
    try {
      const response = await api.get<ApiEnvelope<ValidatedAccount>>(
        '/wallet/bank/details',
        { params: { account_number: accountNumber, bank_code: bankCode } },
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Failed to fetch bank details');
    }
  },

  transfer: async (payload: TransferPayload): Promise<TransferResult> => {
    try {
      const response = await api.post<ApiEnvelope<TransferResult>>(
        '/wallet/transfer',
        payload,
      );
      return response.data.data;
    } catch (error) {
      throwApiError(error, 'Transfer failed');
    }
  },

  transferBulk: async (
    payload: BulkTransferPayload,
  ): Promise<BulkTransferResponse> => {
    try {
      const { data } = await api.post<BulkTransferResponse>(
        '/wallet/transfer/bulk',
        payload,
      );
      return data;
    } catch (error) {
      throwApiError(error, 'Bulk transfer failed');
    }
  },

  addBeneficiary: async (payload: AddBeneficiaryPayload): Promise<void> => {
    try {
      await api.post('/wallet/beneficiary', payload);
    } catch (error) {
      throwApiError(error, 'Failed to add beneficiary');
    }
  },

  getBeneficiaries: async (): Promise<Beneficiary[]> => {
    try {
      // This endpoint does NOT use the standard ApiEnvelope ({ data }).
      // It returns { status, message, beneficiaries }, so unwrap that key
      // and fall back to [] so callers never receive undefined.
      const response = await api.get<{ beneficiaries: Beneficiary[] }>(
        '/wallet/beneficiaries',
      );
      return response.data.beneficiaries ?? [];
    } catch (error) {
      throwApiError(error, 'Failed to load beneficiaries');
    }
  },
};
