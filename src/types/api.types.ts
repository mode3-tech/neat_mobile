export interface ApiEnvelope<T = undefined> {
  status: 'success';
  message: string;
  data: T;
}

export interface ApiErrorEnvelope {
  status: 'error';
  error: { code: string; message: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}
