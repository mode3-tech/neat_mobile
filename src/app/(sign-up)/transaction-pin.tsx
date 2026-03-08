import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useSignUpStore } from '@/stores/sign-up.store';
import { PIN_LENGTH } from '@/constants';

const PRIMARY = '#472FF8';
const ERROR_COLOR = '#EF4444';

export default function TransactionPinScreen() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasError, setHasError] = useState(false);
  const storePin = useSignUpStore((s) => s.setTransactionPin);

  const isPinValid = pin.length === PIN_LENGTH;
  const isMatch = pin === confirmPin && confirmPin.length === PIN_LENGTH;
  const canProceed = pin.length > 0 && confirmPin.length > 0;

  const handleProceed = () => {
    if (!isPinValid || !isMatch) {
      setHasError(true);
      return;
    }
    storePin(pin);
    router.push('/(sign-up)/enable-biometrics');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Create Transaction PIN</Text>
      <Text style={styles.subtitle}>Protect your transactions with a secure PIN.</Text>

      {/* PIN field */}
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

      {/* Confirm PIN field */}
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
