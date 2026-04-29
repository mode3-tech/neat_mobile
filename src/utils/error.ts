export function getErrorMessage(err: unknown, fallback = 'Please try again.'): string {
  const e = err as { response?: { data?: { error?: string } }; message?: string };
  return e?.response?.data?.error || e?.message || fallback;
}
