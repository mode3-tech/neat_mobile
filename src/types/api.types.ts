export interface ApiEnvelope<T = undefined> {
  status: 'success';
  message: string;
  data: T;
}

export interface ApiErrorEnvelope {
  status: 'error';
  error: { code: string; message: string };
}

/**
 * Envelope for endpoints whose pagination fields sit at the top level,
 * next to `data` (e.g. /vas/billers, /vas/products).
 */
export interface PaginatedApiEnvelope<T> extends ApiEnvelope<T[]> {
  page: number;
  size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}
