export function getErrorMessage(err: unknown, fallback = 'Please try again.'): string {
  const e = err as {
    response?: { data?: { error?: { message?: string } | string } };
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
  return e?.message || fallback;
}
