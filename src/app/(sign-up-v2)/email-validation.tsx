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
import { validateEmail } from '@/utils/signup-v2-validation';
import { BackButton } from '@/components/ui/back-button';

const PRIMARY = '#F9B700';
const PRIMARY_TEXT = '#032252';
const ERROR_COLOR = '#EF4444';

/**
 * Unlike v1, email is NOT optional here — register requires
 * email_verification_id, and /validate/bvn takes the email too. There is no
 * skip.
 */
export default function EmailValidationScreen() {
  const storedEmail = useSignUpV2Store((s) => s.email);
  const emailOtpId = useSignUpV2Store((s) => s.emailOtpId);
  const setEmail = useSignUpV2Store((s) => s.setEmail);
  const setEmailOtpId = useSignUpV2Store((s) => s.setEmailOtpId);
  const setEmailOtpCode = useSignUpV2Store((s) => s.setEmailOtpCode);
  const setEmailVerificationId = useSignUpV2Store((s) => s.setEmailVerificationId);

  const [email, setLocalEmail] = useState(storedEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const validationError = validateEmail(email);
  const isValid = !validationError;
  // An empty field shows nothing — the disabled button already says the form
  // isn't finished. Errors are for input that is present and wrong.
  const shownError = error || (touched && email.trim() ? validationError : '');

  // Same as the phone screen: "Change email address" then changing nothing
  // should return to the still-valid code rather than sending a second one.
  const hasLiveOtp = !!emailOtpId && email.trim() === storedEmail && isValid;

  const handleSubmit = async () => {
    if (loading) return;
    setTouched(true);
    if (!isValid) return;

    if (hasLiveOtp) {
      router.push('/(sign-up-v2)/email-otp');
      return;
    }

    setLoading(true);
    setError('');
    const trimmed = email.trim();
    try {
      const { otp_id } = await authV2Service.requestEmailOtp(trimmed);
      setEmail(trimmed);
      setEmailOtpId(otp_id);
      // Editing the address invalidates any previous verification and any
      // digits typed against the old code.
      setEmailVerificationId('');
      setEmailOtpCode('');
      router.push('/(sign-up-v2)/email-otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
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
          <Text style={styles.title}>What's your email?</Text>
        </View>
        <Text style={styles.subtitle}>
          We'll send a 6-digit code to confirm it. You'll get receipts and
          account notices here.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email address</Text>
          <View style={[styles.inputWrap, !!shownError && styles.inputWrapError]}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(t) => {
                setLocalEmail(t);
                if (error) setError('');
              }}
              onBlur={() => setTouched(true)}
              placeholder="Enter your email address"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>
          {shownError ? <Text style={styles.errorText}>{shownError}</Text> : null}
        </View>

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, !isValid && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={PRIMARY_TEXT} />
            ) : (
              <Text style={[styles.primaryBtnText, !isValid && styles.disabledBtnText]}>
                {hasLiveOtp ? 'Continue' : 'Send code'}
              </Text>
            )}
          </TouchableOpacity>

          {hasLiveOtp ? (
            <Text style={styles.footerNote}>
              We already sent a code to this address.
            </Text>
          ) : null}
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
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 28,
  },
  field: {
    marginBottom: 20,
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
  errorText: {
    fontSize: 12,
    color: ERROR_COLOR,
    marginTop: 6,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    paddingBottom: 16,
    gap: 10,
  },
  footerNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
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
