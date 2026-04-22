import type {
  AddBeneficiaryPayload,
  BeneficiariesResponse,
  Beneficiary,
  Bank,
  BanksResponse,
  BulkTransferPayload,
  BulkTransferResponse,
  TransferPayload,
  TransferResponse,
  ValidateAccountResponse,
  ValidatedAccount,
} from '@/types/transfer.types';
import { api } from './api';

export const walletService = {
  getBanks: async (): Promise<Bank[]> => {
    const { data } = await api.get<BanksResponse>('/wallet/banks');
    return data.banks;
  },

  validateAccount: async (
    accountNumber: string,
    bankCode: string,
  ): Promise<ValidatedAccount> => {
    const { data } = await api.get<ValidateAccountResponse>(
      '/wallet/bank/details',
      { params: { account_number: accountNumber, bank_code: bankCode } },
    );
    return data.account;
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
    const { data } = await api.get<BeneficiariesResponse>(
      '/wallet/beneficiaries',
    );
    return data.beneficiaries;
  },
};
