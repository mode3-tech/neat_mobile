import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { authService } from '@/services/auth.service';
import { useSignUpStore } from '@/stores/sign-up.store';
import { BackButton } from '@/components/ui/back-button';

const PRIMARY = '#F9B700';
const PRIMARY_TEXT = '#032252';

export default function PhoneValidationScreen() {
  const phone = useSignUpStore((s) => s.phone);
  const bvnVerificationId = useSignUpStore((s) => s.bvnData?.verification_id ?? '');
  const setPhoneOtpId = useSignUpStore((s) => s.setPhoneOtpId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const { otp_id } = await authService.sendPhoneOtp(bvnVerificationId, {
        purpose: 'signup',
      });
      setPhoneOtpId(otp_id);
      router.push('/(sign-up)/phone-otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View className="flex-row items-center gap-2 mt-4 mb-1.5">
        <BackButton className="" />
        <Text style={styles.title}>Phone Validation</Text>
      </View>
      <Text style={styles.subtitle}>
        We'll send an OTP to:{' '}
        <Text style={styles.phoneHighlight}>{phone} </Text>or the mail attached to your BVN
      </Text>

      <View style={styles.body}>
        <Image
          source={require('../../../assets/images/fone.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
        <Text style={styles.hint}>
          Tap the button below to receive{'\n'}a verification code
        </Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSendOtp}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={PRIMARY_TEXT} />
          ) : (
            <Text style={styles.primaryBtnText}>Send OTP</Text>
          )}
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
  title: {
    fontSize: 22,
    lineHeight: 26,
    includeFontPadding: false,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 13,
    color: '#032252',
    lineHeight: 20,
  },
  phoneHighlight: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  illustration: {
    width: 300,
    height: 300,
  },
  hint: {
    fontSize: 14,
    color: '#032252',
    textAlign: 'center',
    lineHeight: 22,
  },
  spacer: {
    height: 24,
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
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
});
