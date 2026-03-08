export interface BvnData {
  name: string;
  dob: string;
  phone_number: string;
  verification_id: string;
}

export interface NinData {
  name: string;
  dob: string;
  phone_number: string;
  verification_id: string;
}

export interface SignUpPayload {
  bvn: string;
  nin: string;
  phone: string;
  email?: string;
  password: string;
  transactionPin: string;
  biometricsEnabled: boolean;
}
