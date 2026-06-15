export interface VasCategory {
  id: number;
  name: string;
}

export interface VasBiller {
  id: number;
  name: string;
  biller_code: string;
  description: string;
  category_dtos: VasCategory[];
  image: string;
}

export interface VasProduct {
  name: string;
  unique_code: string;
  look_up: boolean;
  fixed_amount: boolean;
  amount: number;
  min_amount: number;
  max_amount: number;
  image_url: string;
  biller_name: string;
  category_dto: VasCategory;
}

export interface BuyAirtimePayload {
  pin: string;
  unique_code: string;
  phone_number: string;
  amount: number;
}

export type BuyDataPayload = BuyAirtimePayload;

/**
 * Route params consumed by the shared VAS result screen.
 * Everything arrives as a string (expo-router serialises params).
 */
export interface VasResultParams {
  status: 'success' | 'failed';
  message: string;
  provider: string;
  phone: string;
  /** Data plan name — only present for data purchases. */
  plan?: string;
  amount: string;
  date: string;
}
