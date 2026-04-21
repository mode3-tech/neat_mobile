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

export function maskEmail(email: string | undefined | null): string {
  if (!email) return '';
  const at = email.lastIndexOf('@');
  if (at <= 0 || at === email.length - 1) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length <= 2) return `${'*'.repeat(local.length)}@${domain}`;
  return `${local.slice(0, 2)}${'*'.repeat(local.length - 2)}@${domain}`;
}
