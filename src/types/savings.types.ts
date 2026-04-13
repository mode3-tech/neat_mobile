export interface SavingsDepositPayload {
  amount: number;
  transaction_pin: string;
}

export interface SavingsDepositResponse {
  status: boolean;
  message: string;
}
