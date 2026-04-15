export function maskPhone(phone: string | undefined | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return phone;

  const normalized = digits.startsWith('234')
    ? `+${digits}`
    : digits.startsWith('0')
      ? `+234${digits.slice(1)}`
      : `+${digits}`;

  if (normalized.length < 10) return normalized;

  const last3 = normalized.slice(-3);
  const first6 = normalized.slice(0, 7);
  return `${first6}****${last3}`;
}
