export interface Bank {
  code: string;
  name: string;
}

export interface BanksResponse {
  banks: Bank[];
}

export interface ValidatedAccount {
  bankCode: string;
  accountName: string;
  accountNumber: string;
}

export interface ValidateAccountResponse {
  status: boolean;
  account: ValidatedAccount;
}

export type TransferType = 'neatpay' | 'other_bank';

export interface TransferPayload {
  amount: number;
  sortCode: string;
  accountNumber: string;
  narration: string;
  accountName: string;
  metadata: Record<string, unknown>;
  transaction_pin: string;
}

export interface TransferResult {
  amount: number;
  charges: number;
  vat: number;
  reference: string;
  total: number;
  sessionId: string;
  destination: string;
  transactionReference: string;
  description: string;
}

export interface TransferResponse {
  status: boolean;
  message: string;
  transfer: TransferResult;
}

export interface AddBeneficiaryPayload {
  bank_code: string;
  account_number: string;
  account_name: string;
  // wallet_id: string;
}

export interface Beneficiary {
  wallet_id: string;
  bank_code: string;
  account_number: string;
  account_name: string;
}

export interface BeneficiariesResponse {
  status: boolean;
  message: string;
  beneficiaries: Beneficiary[];
}
