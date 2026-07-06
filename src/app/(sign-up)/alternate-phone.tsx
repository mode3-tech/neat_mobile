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

import { authService } from '@/services/auth.service';
import { useSignUpStore } from '@/stores/sign-up.store';

const PRIMARY = '#472FF8';
const PHONE_REGEX = /^\+?\d{10,14}$/;

export default function AlternatePhoneScreen() {
  const storedPhone = useSignUpStore((s) => s.submittedPhone);
  const setSubmittedPhone = useSignUpStore((s) => s.setSubmittedPhone);
  const setSubmittedPhoneOtpId = useSignUpStore((s) => s.setSubmittedPhoneOtpId);
  const setSubmittedPhoneVerificationId = useSignUpStore(
    (s) => s.setSubmittedPhoneVerificationId,
  );

  const [phone, setPhone] = useState(storedPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = PHONE_REGEX.test(phone.trim());

  const handleSendOtp = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');
    try {
      const trimmed = phone.trim();
      const { otp_id } = await authService.sendPhoneOtp(null, {
        purpose: 'submitted_contact',
        destination: trimmed,
      });
      setSubmittedPhone(trimmed);
      setSubmittedPhoneOtpId(otp_id);
      setSubmittedPhoneVerificationId('');
      router.push('/(sign-up)/alternate-phone-otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Add a phone number</Text>
        <Text style={styles.subtitle}>
          Since you can't access the number on your BVN, enter a phone number
          you can receive a code on right now.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(val) => {
                // Keep digits and a leading + so pasted numbers like
                // "+234 801 234 5678" don't silently fail validation.
                setPhone(val.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, ''));
                setError('');
              }}
              placeholder="08012345678"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              autoCorrect={false}
            />
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>This will be your sign-in number</Text>
          <Text style={styles.infoBody}>
            You'll use this phone number to sign in to your account. Make sure
            it's a number you can always access.
          </Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, !isValid && styles.disabledBtn]}
            onPress={handleSendOtp}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.primaryBtnText, !isValid && styles.disabledBtnText]}>
                Send Code
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
  field: {},
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
  },
  input: {
    fontSize: 15,
    color: '#1A1A1A',
    padding: 0,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#EEF0FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 4,
    marginBottom:12
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  infoBody: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  spacer: {
    flex: 1,
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
    color: '#fff',
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
