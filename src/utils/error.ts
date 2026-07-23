const OFFLINE_MESSAGE =
  'No internet connection. Please check your network and try again.';

export function getErrorMessage(err: unknown, fallback = 'Please try again.'): string {
  const e = err as {
    response?: { data?: { error?: { message?: string } | string } };
    code?: string;
    message?: string;
  };
  // Server errors are wrapped as `{ error: { code, message } }`. Returning the
  // raw object here would crash any <Text>/toast that renders the result
  // ("Objects are not valid as a React child"), so always reduce to a string.
  const serverError = e?.response?.data?.error;
  if (typeof serverError === 'string') return serverError;
  if (serverError && typeof serverError.message === 'string') {
    return serverError.message;
  }
  // No HTTP response means the request never reached the server — a
  // connectivity/timeout failure. Surface a friendly message instead of the
  // raw axios string ("Network Error" / "timeout of 30000ms exceeded").
  if (!e?.response) {
    const code = e?.code;
    const raw = e?.message ?? '';
    if (
      code === 'ERR_NETWORK' ||
      code === 'ECONNABORTED' ||
      /network error|timeout/i.test(raw)
    ) {
      return OFFLINE_MESSAGE;
    }
  }
  return e?.message || fallback;
}
