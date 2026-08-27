import * as Updates from 'expo-updates';

// One budget for check + fetch combined. The native launcher's own
// `fallbackToCacheTimeout` is baked into the binary and can never be changed by
// an OTA, so the wait lives here instead where the next update can retune it.
const UPDATE_BUDGET_MS = 4000;

function budget(ms: number): Promise<null> {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

/**
 * Fetches and applies a pending OTA update before the app routes anywhere,
 * so an update lands on the launch that finds it instead of the one after.
 *
 * Resolves `true` only when a reload was triggered — the caller should stop.
 * Giving up on the deadline is not a failure: abandoning `fetchUpdateAsync()`
 * does not cancel the download, it just finishes in the background and applies
 * on the next cold start, which is the pre-existing behaviour.
 */
export async function applyPendingUpdate(
  onFetching?: () => void,
): Promise<boolean> {
  if (!Updates.isEnabled) return false;

  const deadline = budget(UPDATE_BUDGET_MS);

  try {
    const check = await Promise.race([Updates.checkForUpdateAsync(), deadline]);
    if (!check?.isAvailable) return false;

    onFetching?.();

    const fetched = await Promise.race([Updates.fetchUpdateAsync(), deadline]);
    if (!fetched?.isNew) return false;

    await Updates.reloadAsync();
    return true;
  } catch {
    return false;
  }
}
