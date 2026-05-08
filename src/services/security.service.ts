export type IntegrityStatus = 'ok' | 'compromised' | 'unknown';

type Listener = (s: IntegrityStatus) => void;

let cachedStatus: IntegrityStatus = __DEV__ ? 'ok' : 'unknown';
const listeners = new Set<Listener>();

function update(next: IntegrityStatus): void {
  // 'compromised' is terminal — a blocking threat that fires AFTER the
  // fallback timer has already settled the status to 'ok' must still be
  // able to flip the gate to blocked.
  if (cachedStatus === 'compromised') return;
  if (cachedStatus === next) return;
  cachedStatus = next;
  listeners.forEach((fn) => fn(next));
}

export function getIntegrityStatus(): IntegrityStatus {
  return cachedStatus;
}

export function subscribeIntegrity(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function reportBlockingThreat(): void {
  update('compromised');
}

export function reportChecksFinished(): void {
  update('ok');
}
