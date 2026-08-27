import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { authV2Service } from '@/services/auth-v2.service';
import { storeTransactionPin } from '@/services/biometric.service';
import { useAuthStore } from '@/stores/auth.store';
import { useSignUpV2Store } from '@/stores/sign-up-v2.store';
import { buildV2RegisterPayload } from '@/utils/register-v2-payload';
import { BackButton } from '@/components/ui/back-button';

const PRIMARY = '#F9B700';
const PRIMARY_TEXT = '#032252';

/**
 * The v2 submit screen. Unlike v1 there is no registration-processing step
 * after this: /v2/auth/register is synchronous and hands back the session
 * tokens, so the account is live by the time this call resolves.
 *
 * The store is only reset on success. A failed register leaves everything in
 * place so the user can retry — this sits behind ~19 typed fields, and wiping
 * them on a provider hiccup would be brutal.
 */
export default function EnableBiometricsScreen() {
  const store = useSignUpV2Store();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setBiometricsEnabled = useAuthStore((s) => s.setBiometricsEnabled);

  const [enabled, setEnabled] = useState(store.biometricsEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggle = (next: boolean) => {
    setEnabled(next);
    store.setBiometrics(next);
  };

  const handleComplete = async () => {
    if (loading) return;
    store.setBiometrics(enabled);
    setLoading(true);
    setError('');
    try {
      // authV2Service.register persists the tokens to SecureStore itself; this
      // brings the in-memory auth store in line so the app treats the user as
      // signed in without a round trip through the sign-in screen.
      const tokens = await authV2Service.register(buildV2RegisterPayload());
      setTokens(tokens.access_token, tokens.refresh_token);
      setBiometricsEnabled(enabled);

      if (enabled) {
        try {
          await storeTransactionPin(store.transactionPin);
        } catch {
          // Non-blocking — biometrics just won't be available until next manual login
        }
      }

      store.reset();
      router.replace('/(sign-up)/registration-success');
    } catch (err: unknown) {
      // v2 messages are provider-supplied and user-facing, so they are shown
      // as-is rather than mapped to app copy.
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View className="flex-row items-center gap-2 mt-4 mb-1.5">
        <BackButton className="" />
        <Text style={styles.title}>Enable Biometrics</Text>
      </View>
      <Text style={styles.subtitle}>Use fingerprint or Face ID</Text>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Enable</Text>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{ false: '#E5E7EB', true: PRIMARY_TEXT }}
          thumbColor="#fff"
          disabled={loading}
        />
      </View>

      <View style={styles.spacer} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.footer}>
        <View style={styles.btnOuter}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleComplete}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={PRIMARY_TEXT} />
            ) : (
              <Text style={styles.primaryBtnText}>Complete Setup</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
    includeFontPadding: false,
    fontWeight: '700',
    color: PRIMARY_TEXT,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 28,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleLabel: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  footer: {
    paddingBottom: 16,
    gap: 12,
  },
  btnOuter: {
    borderWidth: 2,
    borderColor: 'rgba(249, 183, 0, 0.3)',
    borderRadius: 50,
    padding: 3,
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 46,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: PRIMARY_TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
});
