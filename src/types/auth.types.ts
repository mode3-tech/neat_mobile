export interface LoginPayload {
  phone: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
