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
import {
  normalizePhone,
  PHONE_INPUT_MAX_LENGTH,
  PHONE_LENGTH,
  validatePhone,
} from '@/utils/signup-v2-validation';
import { BackButton } from '@/components/ui/back-button';

const PRIMARY = '#F9B700';
const PRIMARY_TEXT = '#032252';
const ERROR_COLOR = '#EF4444';

export default function PhoneValidationScreen() {
  const storedPhone = useSignUpV2Store((s) => s.phone);
  const phoneOtpId = useSignUpV2Store((s) => s.phoneOtpId);
  const setPhone = useSignUpV2Store((s) => s.setPhone);
  const setPhoneOtpId = useSignUpV2Store((s) => s.setPhoneOtpId);
  const setPhoneOtpCode = useSignUpV2Store((s) => s.setPhoneOtpCode);

  const [phone, setLocalPhone] = useState(storedPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Errors appear once the user has committed to a value (submit or blur), not
  // while they are still typing the first few digits.
  const [touched, setTouched] = useState(false);

  const validationError = validatePhone(phone);
  const isValid = !validationError;
  // Blur alone isn't enough here: the number pad has no return key, so someone
  // who types 11 digits and stops never blurs the field and would sit looking
  // at a disabled button with no explanation. Once the number is full length,
  // say what's wrong with it immediately.
  // An empty field shows nothing — the disabled button already says the form
  // isn't finished. Errors are for input that is present and wrong.
  // A number still carrying its 234 prefix is mid-normalization by construction
  // — it becomes valid on the 13th digit — so don't call it wrong on the way.
  const inProgressIntl = phone.startsWith('234');
  const showValidation =
    !!phone && !inProgressIntl && (touched || phone.length >= PHONE_LENGTH);
  const shownError = error || (showValidation ? validationError : '');

  /**
   * Coming back from the OTP screen via "Change phone number" and then
   * deciding not to change it: the code already sent is still valid, so
   * continue straight back to it instead of burning a second SMS. Only true
   * while the number is untouched — editing it invalidates the sent code.
   */
  const hasLiveOtp = !!phoneOtpId && phone === storedPhone && isValid;

  const handleSubmit = async () => {
    if (loading) return;
    setTouched(true);
    if (!isValid) return;

    if (hasLiveOtp) {
      router.push('/(sign-up-v2)/phone-otp');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { otp_id } = await authV2Service.requestPhoneOtp(phone);
      setPhone(phone);
      setPhoneOtpId(otp_id);
      // A new code means whatever was half-typed against the old one is stale.
      setPhoneOtpCode('');
      router.push('/(sign-up-v2)/phone-otp');
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
          <Text style={styles.title}>What's your phone number?</Text>
        </View>
        <Text style={styles.subtitle}>
          We'll send you a 6-digit code to confirm it. This becomes the number
          you sign in with.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Phone number</Text>
          <View style={[styles.inputWrap, !!shownError && styles.inputWrapError]}>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(t) => {
                // Accepts +234…, 234…, and a bare 10-digit number, all
                // normalized to the 0-prefixed form the backend expects.
                setLocalPhone(normalizePhone(t));
                if (error) setError('');
              }}
              onBlur={() => setTouched(true)}
              placeholder="Enter your phone number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              // Room for the longest form someone can type before normalizing:
              // +2348031234567. Capping at 11 here would truncate that to a
              // number normalizePhone can never repair.
              maxLength={PHONE_INPUT_MAX_LENGTH}
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
              We already sent a code to this number.
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
