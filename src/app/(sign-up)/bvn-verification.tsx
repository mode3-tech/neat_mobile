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
import { BVN_LENGTH } from '@/constants';
import type { BvnData } from '@/types/sign-up.types';
import { maskPhone } from '@/utils/mask';

const PRIMARY = '#472FF8';
const ERROR_COLOR = '#EF4444';

type Status = 'idle' | 'loading' | 'error' | 'verified';

export default function BvnVerificationScreen() {
  const [bvn, setBvn] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [bvnResult, setBvnResult] = useState<BvnData | null>(null);
  const storeBvnData = useSignUpStore((s) => s.setBvnData);

  const isValid = bvn.length === BVN_LENGTH;
  const isLoading = status === 'loading';
  const isError = status === 'error';
  const isVerified = status === 'verified';

  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async () => {
    if (!isValid || isLoading) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await authService.verifyBvn(bvn);
      setBvnResult(data);
      setStatus('verified');
    } catch (err: any) {
      setErrorMsg(err?.message || 'BVN verification failed');
      setStatus('error');
    }
  };

  const handleConfirm = () => {
    if (!bvnResult) return;
    storeBvnData(bvn, bvnResult);
    router.push('/(sign-up)/phone-validation');
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

        <Text style={styles.title}>BVN Verification</Text>
        <Text style={styles.subtitle}>Your BVN is required for secure identity verification.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>BVN Number</Text>
          <View style={[styles.inputWrap, isError && styles.inputWrapError]}>
            <TextInput
              style={styles.input}
              value={bvn}
              onChangeText={(t) => {
                setBvn(t.replace(/\D/g, '').slice(0, BVN_LENGTH));
                if (isError) setStatus('idle');
              }}
              placeholder="Enter 11-digit BVN"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={BVN_LENGTH}
              editable={!isVerified}
            />
          </View>
          <View style={styles.helpRow}>
            {/* {isError && <Text style={styles.errorText}>{errorMsg}</Text>} */}
            <Text style={[styles.helpLink, !isError && { flex: 1, textAlign: 'right' }]}>
              To check your BVN, dial *565*0#.
            </Text>
          </View>
        </View>
             {isError && <Text style={styles.errorText}>{errorMsg}</Text>}

        {isVerified && bvnResult && (
          <View style={styles.infoCard}>
            <InfoRow label="Name:" value={bvnResult.name} />
            {/* <InfoRow label="DOB:" value={bvnResult.dob} /> */}
            <InfoRow label="Phone:" value={maskPhone(bvnResult.phone_number)} />
          </View>
        )}

        <View style={styles.spacer} />

        <View style={styles.footer}>
          {isVerified ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Confirm & Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, !isValid && styles.disabledBtn]}
              onPress={handleVerify}
              disabled={!isValid || isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.primaryBtnText, !isValid && styles.disabledBtnText]}>
                  Verify BVN
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  field: {
    marginBottom: 4,
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
    color: PRIMARY,
    marginLeft: 'auto',
  },
  errorText: {
    fontSize: 12,
    color: ERROR_COLOR,
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#EEF0FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    width: 52,
  },
  infoValue: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
    flex: 1,
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
