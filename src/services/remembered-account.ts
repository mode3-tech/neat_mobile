import * as SecureStore from 'expo-secure-store';

const REMEMBERED_ACCOUNT_KEY = 'remembered_account';

export interface RememberedAccount {
  phone: string;
  firstName: string;
}

function parse(raw: string): RememberedAccount | null {
  try {
    const parsed = JSON.parse(raw) as Partial<RememberedAccount>;
    if (typeof parsed?.phone !== 'string' || !parsed.phone) return null;
    return {
      phone: parsed.phone,
      firstName: typeof parsed.firstName === 'string' ? parsed.firstName : '',
    };
  } catch {
    return null;
  }
}

// Compares on the last 10 digits so 0801…, +234801… and 234801… all match.
export function isSamePhone(a: string, b: string): boolean {
  const tail = (s: string) => s.replace(/\D/g, '').slice(-10);
  const ta = tail(a);
  return ta.length === 10 && ta === tail(b);
}

export async function persistRememberedAccount(account: RememberedAccount): Promise<void> {
  if (!account.phone) return;
  try {
    await SecureStore.setItemAsync(REMEMBERED_ACCOUNT_KEY, JSON.stringify(account));
  } catch {
    // best-effort — a failed write only costs the user a phone-number entry
  }
}

export async function getRememberedAccount(): Promise<RememberedAccount | null> {
  try {
    const raw = await SecureStore.getItemAsync(REMEMBERED_ACCOUNT_KEY);
    return raw ? parse(raw) : null;
  } catch {
    return null;
  }
}

export async function forgetRememberedAccount(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(REMEMBERED_ACCOUNT_KEY);
  } catch {
    // best-effort
  }
}
