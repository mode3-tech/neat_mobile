import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { authService } from '@/services/auth.service';
import { useSignUpStore } from '@/stores/sign-up.store';
import { getRegisterErrorAction, type RegisterErrorAction } from '@/utils/register-errors';
import { buildRegisterPayload } from '@/utils/register-payload';
import { colors } from '@/theme/palette';
import { weight } from '@/theme/typography';

const PRIMARY = colors.primary;

export default function EnableBiometricsScreen() {
  const store = useSignUpStore();

  const [enabled, setEnabled] = useState(store.biometricsEnabled);
  const [redeemCode, setRedeemCode] = useState(store.redeemCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorAction, setErrorAction] = useState<RegisterErrorAction | null>(null);

  const handleToggle = (next: boolean) => {
    setEnabled(next);
    store.setBiometrics(next);
  };

  const handleComplete = async () => {
    store.setBiometrics(enabled);
    store.setRedeemCode(redeemCode.trim());
    setLoading(true);
    setError('');
    setErrorAction(null);
    try {
      const result = await authService.registerUser(buildRegisterPayload());

      store.setRegistrationJob(
        result.job_id,
        result.claim_token,
        result.claim_expires_at,
      );

      router.replace('/(sign-up)/registration-processing' as any);
    } catch (err: unknown) {
      const action = getRegisterErrorAction(err);
      if (action) {
        setError(action.message);
        setErrorAction(action);
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
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
          onValueChange={handleToggle}
          trackColor={{ false: colors.surfaceDisabled, true: PRIMARY }}
          thumbColor={colors.surface}
        />
      </View>

      <View style={styles.redeemBlock}>
        <Text style={styles.redeemLabel}>Redeem code (optional)</Text>
        <TextInput
          style={styles.redeemInput}
          value={redeemCode}
          onChangeText={setRedeemCode}
          placeholder="Enter referral or promo code"
          placeholderTextColor={colors.inkMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          editable={!loading}
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
              <ActivityIndicator color={colors.inkInverse} />
            ) : (
              <Text style={styles.primaryBtnText}>Complete Setup</Text>
            )}
          </TouchableOpacity>
        </View>

        {errorAction && !loading ? (
          <TouchableOpacity
            style={styles.recoveryBtn}
            onPress={errorAction.recover}
            activeOpacity={0.85}
          >
            <Text style={styles.recoveryBtnText}>{errorAction.ctaLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
  },
  backBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    color: colors.inkBody,
    ...weight.medium,
  },
  title: {
    fontSize: 22,
    ...weight.bold,
    color: colors.ink,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
    marginBottom: 28,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleLabel: {
    fontSize: 15,
    color: colors.ink,
    ...weight.medium,
  },
  redeemBlock: {
    marginTop: 20,
  },
  redeemLabel: {
    fontSize: 13,
    color: colors.inkSoft,
    ...weight.medium,
    marginBottom: 8,
  },
  redeemInput: {
    backgroundColor: colors.surfaceInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.ink,
  },
  spacer: {
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 12,
  },
  footer: {
    paddingBottom: 16,
    gap: 12,
  },
  recoveryBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
  },
  recoveryBtnText: {
    fontSize: 15,
    color: colors.inkBody,
    ...weight.semibold,
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
    color: colors.inkInverse,
    fontSize: 16,
    ...weight.semibold,
  },
});
