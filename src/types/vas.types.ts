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

export interface BuyCablePayload {
  pin: string;
  unique_code: string;
  /** Smartcard / IUC number. */
  account_number: string;
  /** Provider code, e.g. "DSTV" / "GOTV" / "STARTIMES". */
  account_type: string;
  no_of_month: number;
  /** Total charged = package amount × no_of_month. */
  amount: number;
}

export interface BuyElectricityPayload {
  pin: string;
  unique_code: string;
  /** Meter number. */
  account_number: string;
  /** Meter type — "prepaid" or "postpaid" (selects the matching product). */
  account_type: string;
  amount: number;
}

/**
 * Nested data returned by a successful `/vas/electricity` purchase
 * (`response.data.data.data`). Prepaid returns a recharge `token` + `unit`;
 * postpaid may omit them.
 */
export interface ElectricityPurchaseData {
  token?: string;
  unit?: string;
}

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
  /** Smartcard number — only present for cable purchases. */
  smartcard?: string;
  /** Cable package name — only present for cable purchases. */
  packageName?: string;
  /** Number of months — only present for cable purchases. */
  months?: string;
  /** Meter number — only present for electricity purchases. */
  meter?: string;
  /** Meter type ("Prepaid"/"Postpaid") — only present for electricity. */
  meterType?: string;
  /** Recharge token — only present for successful prepaid electricity. */
  token?: string;
  /** Units dispensed (e.g. "45.20 kWh") — only present for prepaid electricity. */
  units?: string;
  amount: string;
  date: string;
}
