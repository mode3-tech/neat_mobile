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

import { useSignUpStore } from '@/stores/sign-up.store';
import { colors } from '@/theme/palette';

const PRIMARY = colors.primary;
const ERROR_COLOR = colors.danger;

const REQUIREMENTS = [
  { label: 'An uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'A lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'A number', test: (p: string) => /\d/.test(p) },
  { label: 'A symbol', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function CreatePasswordScreen() {
  const storedPassword = useSignUpStore((s) => s.password);
  const storePassword = useSignUpStore((s) => s.setPassword);

  const [editing, setEditing] = useState(!storedPassword);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasError, setHasError] = useState(false);

  const passedCount = REQUIREMENTS.filter((r) => r.test(password)).length;
  const isValidPassword = password.length >= 8 && passedCount >= 3;
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
      router.push('/(sign-up)/transaction-pin');
      return;
    }
    if (!isValidPassword || !isMatch) {
      setHasError(true);
      return;
    }
    storePassword(password);
    router.push('/(sign-up)/transaction-pin');
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

          <Text style={styles.title}>Create Secure Password</Text>
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
          {/* Password field */}
          <View style={styles.field}>
            <Text style={styles.label}>New Password</Text>
            <View style={[styles.inputWrap, hasError && !isValidPassword && styles.inputWrapError]}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setHasError(false);
                }}
                placeholder="Enter password"
                placeholderTextColor={colors.inkMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
              </TouchableOpacity>
            </View>

            {/* Requirements */}
            <View style={styles.requirements}>
              <Text style={[styles.reqIntro, hasError && !isValidPassword && styles.reqError]}>
                Make sure your password is 8 or more characters and has at least 3 of the following:
              </Text>
              {REQUIREMENTS.map((r) => (
                <View key={r.label} style={styles.bulletRow}>
                  <Text style={[styles.bullet, hasError && !isValidPassword && styles.reqError]}>
                    {'•'}
                  </Text>
                  <Text style={[styles.bulletText, hasError && !isValidPassword && styles.reqError]}>
                    {r.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Confirm password field */}
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
                placeholderTextColor={colors.inkMuted}
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
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
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
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
    marginBottom: 28,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkBody,
    marginBottom: 8,
  },
  inputWrap: {
    backgroundColor: colors.surfaceInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapError: {
    backgroundColor: colors.surface,
    borderColor: ERROR_COLOR,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    padding: 0,
  },
  eyeIcon: {
    fontSize: 16,
    color: colors.inkMuted,
  },
  requirements: {
    marginTop: 10,
    gap: 4,
  },
  reqIntro: {
    fontSize: 12,
    color: colors.inkSoft,
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
    color: colors.inkSoft,
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 12,
    color: colors.inkSoft,
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
    color: colors.inkInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledBtn: {
    backgroundColor: colors.surfaceDisabled,
  },
  disabledBtnText: {
    color: colors.inkMuted,
  },
  setCard: {
    backgroundColor: colors.primarySurface,
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
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: colors.inkInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  setTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  setBody: {
    fontSize: 13,
    color: colors.inkBody,
    lineHeight: 18,
  },
  changeLink: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
    marginTop: 4,
  },
});
