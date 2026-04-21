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

import { authService } from '@/services/auth.service';
import { storeTransactionPin } from '@/services/biometric.service';
import { useSignUpStore } from '@/stores/sign-up.store';
import { useAuthStore } from '@/stores/auth.store';

const PRIMARY = '#472FF8';

export default function EnableBiometricsScreen() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const store = useSignUpStore();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setBiometricsEnabled = useAuthStore((s) => s.setBiometricsEnabled);

  const handleComplete = async () => {
    store.setBiometrics(enabled);
    setLoading(true);
    setError('');
    try {
      const result = await authService.registerUser({
        phone_number: store.phone,
        email: store.email,
        password: store.password,
        confirm_password: store.password,
        transaction_pin: store.transactionPin,
        confirm_transaction_pin: store.transactionPin,
        bvn_verification_id: store.bvnData?.verification_id ?? '',
        nin_verification_id: store.ninData?.verification_id ?? '',
        phone_verification_id: store.phoneVerificationId,
        email_verification_id: store.emailVerificationId,
        is_biometrics_enabled: enabled,
      });

      setTokens(result.access_token, result.refresh_token);
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
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Enable Biometrics</Text>
      <Text style={styles.subtitle}>Use fingerprint or Face ID</Text>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Enable</Text>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: '#E5E7EB', true: PRIMARY }}
          thumbColor="#fff"
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
              <ActivityIndicator color="#fff" />
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
  backBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
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
  },
  btnOuter: {
    borderWidth: 2,
    borderColor: 'rgba(71, 47, 248, 0.3)',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
