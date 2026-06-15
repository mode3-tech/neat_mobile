import type {
  AddBeneficiaryPayload,
  Beneficiary,
  Bank,
  BulkTransferPayload,
  BulkTransferResponse,
  TransferPayload,
  TransferResponse,
  ValidatedAccount,
} from '@/types/transfer.types';
import type { ApiEnvelope } from '@/types/api.types';
import { api } from './api';

export const walletService = {
  getBanks: async (): Promise<Bank[]> => {
    const response = await api.get<ApiEnvelope<Bank[]>>('/wallet/banks');
    return response.data.data;
  },

  validateAccount: async (
    accountNumber: string,
    bankCode: string,
  ): Promise<ValidatedAccount> => {
    const response = await api.get<ApiEnvelope<ValidatedAccount>>(
      '/wallet/bank/details',
      { params: { account_number: accountNumber, bank_code: bankCode } },
    );
    return response.data.data;
  },

  transfer: async (payload: TransferPayload): Promise<TransferResponse> => {
    const { data } = await api.post<TransferResponse>(
      '/wallet/transfer',
      payload,
    );
    return data;
  },

  transferBulk: async (
    payload: BulkTransferPayload,
  ): Promise<BulkTransferResponse> => {
    const { data } = await api.post<BulkTransferResponse>(
      '/wallet/transfer/bulk',
      payload,
    );
    return data;
  },

  addBeneficiary: async (payload: AddBeneficiaryPayload): Promise<void> => {
    await api.post('/wallet/beneficiary', payload);
  },

  getBeneficiaries: async (): Promise<Beneficiary[]> => {
    const response = await api.get<ApiEnvelope<Beneficiary[]>>(
      '/wallet/beneficiaries',
    );
    return response.data.data;
  },
};
