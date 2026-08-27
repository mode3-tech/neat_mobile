import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';

import { authV2Service } from '@/services/auth-v2.service';
import { useSignUpV2Store } from '@/stores/sign-up-v2.store';
import { BVN_LENGTH } from '@/constants';
import { formatDobInput, fromIsoDob, toIsoDob } from '@/utils/dob';
import { validateBvn, validateDob } from '@/utils/signup-v2-validation';
import { BackButton } from '@/components/ui/back-button';

const PRIMARY = '#F9B700';
const PRIMARY_TEXT = '#032252';
const ERROR_COLOR = '#EF4444';

// TODO (CBN liveness): v2 has no face-match step today. When the backend adds
// one, it slots in HERE — between a successful /validate/bvn and the identity
// form — so the selfie is captured while the BVN record is fresh. v1's
// (sign-up)/face-liveness.tsx is the reference implementation.

export default function BvnVerificationScreen() {
  const store = useSignUpV2Store();

  const [bvn, setBvn] = useState(store.bvn);
  const [dob, setDob] = useState(fromIsoDob(store.dob));
  const [redeemCode, setRedeemCode] = useState(store.redeemCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referralError, setReferralError] = useState('');
  const [touched, setTouched] = useState(false);

  const isoDob = toIsoDob(dob);
  const bvnError = validateBvn(bvn);
  const dobError = validateDob(dob);
  const isValid = !bvnError && !dobError;

  // Both fields use the number pad, which has no return key — someone who
  // fills a field and stops never blurs it. Once a field is at full length,
  // show what's wrong without waiting for a blur that may never come.
  // Empty fields stay silent — the disabled button covers "not finished".
  const showBvnError = !!bvn && (touched || bvn.length >= BVN_LENGTH);
  const showDobError =
    !!dob && (touched || dob.replace(/\D/g, '').length >= 8);

  const handleVerify = async () => {
    if (loading) return;
    setTouched(true);
    if (!isValid || !isoDob) return;
    setLoading(true);
    setError('');
    setReferralError('');
    const code = redeemCode.trim();
    try {
      const result = await authV2Service.validateBvn({
        bvn,
        dob: isoDob,
        email: store.email,
        ...(code ? { referral_code: code } : {}),
      });

      store.setBvn(bvn);
      store.setDob(isoDob);
      store.setRedeemCode(code);

      // requires_otp is the only place the wallet provider shows through.
      // Optimus needs its own OTP round-trip; Providus returns
      // requires_otp: false with an empty provider_reference_id and the BVN
      // check simply queued server-side, so there is nothing to show the user
      // — skip the OTP screen entirely.
      //
      // Belt and braces on the reference: an OTP screen with no reference to
      // verify against would be a dead end, so treat a missing one as "no OTP
      // step" rather than trusting the flag alone.
      const needsProviderOtp =
        result.requires_otp && !!result.provider_reference_id;
      store.setProviderOtp(needsProviderOtp, result.provider_reference_id ?? '');

      router.push(
        needsProviderOtp
          ? '/(sign-up-v2)/provider-otp'
          : '/(sign-up-v2)/personal-details',
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'BVN validation failed';
      // Referral problems are a correctable single field — put the message on
      // the input rather than in the page-level error, where it reads as if the
      // BVN itself failed.
      if (code && /referr?al|redeem/i.test(message)) {
        setReferralError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        <View className="flex-row items-center gap-2 mt-4 mb-1.5">
          <BackButton className="" />
          <Text style={styles.title}>BVN Verification</Text>
        </View>
        <Text style={styles.subtitle}>
          Your BVN and date of birth are required for secure identity
          verification.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>BVN Number</Text>
          <View
            style={[styles.inputWrap, showBvnError && !!bvnError && styles.inputWrapError]}
          >
            <TextInput
              style={styles.input}
              value={bvn}
              onChangeText={(t) => {
                setBvn(t.replace(/\D/g, '').slice(0, BVN_LENGTH));
                if (error) setError('');
              }}
              onBlur={() => setTouched(true)}
              placeholder="Enter your 11-digit BVN"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={BVN_LENGTH}
              editable={!loading}
            />
          </View>
          {showBvnError && bvnError ? (
            <Text style={styles.errorText}>{bvnError}</Text>
          ) : (
            <View style={styles.helpRow}>
              <Text style={styles.helpLink}>To check your BVN, dial *565*0#.</Text>
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Date of birth</Text>
          <View
            style={[styles.inputWrap, showDobError && !!dobError && styles.inputWrapError]}
          >
            <TextInput
              style={styles.input}
              value={dob}
              onChangeText={(t) => {
                setDob(formatDobInput(t));
                if (error) setError('');
              }}
              onBlur={() => setTouched(true)}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={10}
              editable={!loading}
            />
          </View>
          {showDobError && dobError ? (
            <Text style={styles.errorText}>{dobError}</Text>
          ) : (
            <Text style={styles.hint}>Must match the date on your BVN record.</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Referral code (optional)</Text>
          <View style={[styles.inputWrap, !!referralError && styles.inputWrapError]}>
            <TextInput
              style={styles.input}
              value={redeemCode}
              onChangeText={(t) => {
                setRedeemCode(t);
                if (referralError) setReferralError('');
              }}
              placeholder="Enter referral or promo code"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!loading}
            />
          </View>
          {referralError ? (
            <Text style={styles.errorText}>{referralError}</Text>
          ) : null}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, !isValid && styles.disabledBtn]}
            onPress={handleVerify}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={PRIMARY_TEXT} />
            ) : (
              <Text style={[styles.primaryBtnText, !isValid && styles.disabledBtnText]}>
                Verify BVN
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
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
    color: '#032252',
    lineHeight: 20,
    marginBottom: 28,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrap: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputWrapError: {
    backgroundColor: '#fff',
    borderColor: ERROR_COLOR,
  },
  input: {
    fontSize: 15,
    color: '#1A1A1A',
    padding: 0,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  helpLink: {
    fontSize: 12,
    color: '#032252',
    marginLeft: 'auto',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: ERROR_COLOR,
    marginTop: 6,
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
  footer: {
    paddingBottom: 16,
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: PRIMARY_TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledBtn: {
    backgroundColor: '#E5E7EB',
  },
  disabledBtnText: {
    color: '#9CA3AF',
  },
});
