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
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailValidationScreen() {
  const storedEmail = useSignUpStore((s) => s.email);
  const storedEmailVerificationId = useSignUpStore((s) => s.emailVerificationId);
  const storeEmail = useSignUpStore((s) => s.setEmail);
  const storeEmailVerificationId = useSignUpStore((s) => s.setEmailVerificationId);

  const isAlreadyVerified = !!storedEmail && !!storedEmailVerificationId;

  const [editing, setEditing] = useState(!isAlreadyVerified);
  const [email, setEmail] = useState(storedEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = EMAIL_REGEX.test(email);

  const handleStartEditing = () => {
    setEditing(true);
    setEmail('');
    setError('');
  };

  const handleProceed = async () => {
    if (!editing) {
      router.push('/(sign-up)/create-password');
      return;
    }
    if (!isValid || loading) return;
    setLoading(true);
    setError('');
    try {
      await authService.sendEmailOtp(email);
      storeEmail(email);
      storeEmailVerificationId('');
      router.push('/(sign-up)/email-otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/(sign-up)/create-password');
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

        <Text style={styles.title}>Email Validation</Text>
        <Text style={styles.subtitle}>Enter your email address</Text>

        {!editing && (
          <View style={styles.setCard}>
            <View style={styles.setHeader}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
              <Text style={styles.setTitle}>Email verified</Text>
            </View>
            <Text style={styles.setBody}>{storedEmail}</Text>
            <TouchableOpacity onPress={handleStartEditing} activeOpacity={0.7}>
              <Text style={styles.changeLink}>Change email</Text>
            </TouchableOpacity>
          </View>
        )}

        {editing && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(val) => { setEmail(val); setError(''); }}
                  placeholder="example@gmail.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>
        )}

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, editing && !isValid && styles.disabledBtn]}
            onPress={handleProceed}
            disabled={editing ? (!isValid || loading) : false}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.primaryBtnText, editing && !isValid && styles.disabledBtnText]}>
                Proceed
              </Text>
            )}
          </TouchableOpacity>

          {editing && (
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip Now</Text>
            </TouchableOpacity>
          )}
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
  spacer: {
    flex: 1,
  },
  footer: {
    paddingBottom: 16,
    gap: 4,
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
  skipBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  setCard: {
    backgroundColor: '#EEF0FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  setTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  setBody: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  changeLink: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
    marginTop: 4,
  },
});
