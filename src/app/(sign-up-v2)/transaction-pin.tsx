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
import { PIN_LENGTH } from '@/constants';
import { BackButton } from '@/components/ui/back-button';

const PRIMARY = '#F9B700';
const PRIMARY_TEXT = '#032252';
const ERROR_COLOR = '#EF4444';

export default function TransactionPinScreen() {
  const storedPin = useSignUpV2Store((s) => s.transactionPin);
  const storePin = useSignUpV2Store((s) => s.setTransactionPin);

  const [editing, setEditing] = useState(!storedPin);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isPinValid = pin.length === PIN_LENGTH;
  const isMatch = pin === confirmPin && confirmPin.length === PIN_LENGTH;
  const canProceed = editing ? pin.length > 0 && confirmPin.length > 0 : true;

  const handleStartEditing = () => {
    setEditing(true);
    setPin('');
    setConfirmPin('');
    setHasError(false);
  };

  const handleProceed = () => {
    if (!editing) {
      router.push('/(sign-up-v2)/enable-biometrics');
      return;
    }
    if (!isPinValid || !isMatch) {
      setHasError(true);
      return;
    }
    storePin(pin);
    router.push('/(sign-up-v2)/enable-biometrics');
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
          <Text style={styles.title}>Create Transaction PIN</Text>
        </View>
        <Text style={styles.subtitle}>Protect your transactions with a secure PIN.</Text>

        {!editing && (
          <View style={styles.setCard}>
            <View style={styles.setHeader}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
              <Text style={styles.setTitle}>PIN set</Text>
            </View>
            <Text style={styles.setBody}>
              Your PIN is saved. Tap proceed to continue, or change it below.
            </Text>
            <TouchableOpacity onPress={handleStartEditing} activeOpacity={0.7}>
              <Text style={styles.changeLink}>Change PIN</Text>
            </TouchableOpacity>
          </View>
        )}

        {editing && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Create 4-digit PIN</Text>
              <View style={[styles.inputWrap, hasError && !isPinValid && styles.inputWrapError]}>
                <TextInput
                  style={styles.input}
                  value={pin}
                  onChangeText={(t) => {
                    setPin(t.replace(/\D/g, '').slice(0, PIN_LENGTH));
                    setHasError(false);
                  }}
                  placeholder="—"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPin}
                  keyboardType="number-pad"
                  maxLength={PIN_LENGTH}
                />
                <TouchableOpacity onPress={() => setShowPin((v) => !v)}>
                  <Text style={styles.eyeIcon}>{showPin ? '👁' : '👁‍🗨'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm PIN</Text>
              <View style={[styles.inputWrap, hasError && !isMatch && styles.inputWrapError]}>
                <TextInput
                  style={styles.input}
                  value={confirmPin}
                  onChangeText={(t) => {
                    setConfirmPin(t.replace(/\D/g, '').slice(0, PIN_LENGTH));
                    setHasError(false);
                  }}
                  placeholder="—"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirm}
                  keyboardType="number-pad"
                  maxLength={PIN_LENGTH}
                />
                <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                  <Text style={styles.eyeIcon}>{showConfirm ? '👁' : '👁‍🗨'}</Text>
                </TouchableOpacity>
              </View>
              {hasError && !isMatch && confirmPin.length > 0 && (
                <Text style={styles.errorText}>PINs do not match</Text>
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
