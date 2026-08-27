import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';

import { useSignUpV2Store } from '@/stores/sign-up-v2.store';
import { BackButton } from '@/components/ui/back-button';

const PRIMARY = '#F9B700';
const PRIMARY_TEXT = '#032252';
const ERROR_COLOR = '#EF4444';

const REQUIREMENTS = [
  { label: 'An uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'A lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'A number', test: (p: string) => /\d/.test(p) },
  { label: 'A symbol', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function CreatePasswordScreen() {
  const storedPassword = useSignUpV2Store((s) => s.password);
  const storePassword = useSignUpV2Store((s) => s.setPassword);

  const [editing, setEditing] = useState(!storedPassword);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasError, setHasError] = useState(false);

  // All four required — kept in step with the v1 flow's create-password.
  const isValidPassword =
    password.length >= 8 && REQUIREMENTS.every((r) => r.test(password));
  const isMatch = password === confirmPassword && confirmPassword.length > 0;
  const canProceed = editing
    ? password.length > 0 && confirmPassword.length > 0
    : true;

  const handleStartEditing = () => {
    setEditing(true);
    setPassword('');
    setConfirmPassword('');
    setHasError(false);
  };

  const handleProceed = () => {
    if (!editing) {
      router.push('/(sign-up-v2)/transaction-pin');
      return;
    }
    if (!isValidPassword || !isMatch) {
      setHasError(true);
      return;
    }
    storePassword(password);
    router.push('/(sign-up-v2)/transaction-pin');
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
          <Text style={styles.title}>Create Secure Password</Text>
        </View>
        <Text style={styles.subtitle}>Protect your account with a password and PIN</Text>

        {!editing && (
          <View style={styles.setCard}>
            <View style={styles.setHeader}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
              <Text style={styles.setTitle}>Password set</Text>
            </View>
            <Text style={styles.setBody}>
              Your password is saved. Tap proceed to continue, or change it below.
            </Text>
            <TouchableOpacity onPress={handleStartEditing} activeOpacity={0.7}>
              <Text style={styles.changeLink}>Change password</Text>
            </TouchableOpacity>
          </View>
        )}

        {editing && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>New Password</Text>
              <View
                style={[
                  styles.inputWrap,
                  hasError && !isValidPassword && styles.inputWrapError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setHasError(false);
                  }}
                  placeholder="Enter password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.requirements}>
                <Text
                  style={[styles.reqIntro, hasError && !isValidPassword && styles.reqError]}
                >
                  Make sure your password is 8 or more characters and includes all of the
                  following:
                </Text>
                {REQUIREMENTS.map((r) => (
                  <View key={r.label} style={styles.bulletRow}>
                    <Text
                      style={[styles.bullet, hasError && !isValidPassword && styles.reqError]}
                    >
                      {'•'}
                    </Text>
                    <Text
                      style={[
                        styles.bulletText,
                        hasError && !isValidPassword && styles.reqError,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm new password</Text>
              <View style={[styles.inputWrap, hasError && !isMatch && styles.inputWrapError]}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    setHasError(false);
                  }}
                  placeholder="Please enter password again"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                  <Text style={styles.eyeIcon}>{showConfirm ? '👁' : '👁‍🗨'}</Text>
                </TouchableOpacity>
              </View>
              {hasError && !isMatch && confirmPassword.length > 0 && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
            </View>
          </>
        )}

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, !canProceed && styles.disabledBtn]}
            onPress={handleProceed}
            disabled={!canProceed}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnText, !canProceed && styles.disabledBtnText]}>
              Proceed
            </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapError: {
    backgroundColor: '#fff',
    borderColor: ERROR_COLOR,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    padding: 0,
  },
  eyeIcon: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  requirements: {
    marginTop: 10,
    gap: 4,
  },
  reqIntro: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  reqError: {
    color: ERROR_COLOR,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 6,
  },
  bullet: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
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
  setCard: {
    backgroundColor: '#FFFBEF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F9B700',
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
    color: PRIMARY_TEXT,
  },
  setBody: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  // Navy, not PRIMARY — a yellow link on the cream card would be unreadable.
  changeLink: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY_TEXT,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
});
