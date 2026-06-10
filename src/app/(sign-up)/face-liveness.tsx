import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { authService } from '@/services/auth.service';
import { useSignUpStore } from '@/stores/sign-up.store';

const PRIMARY = '#472FF8';
const ERROR_COLOR = '#EF4444';
const SUCCESS_COLOR = '#16A34A';

type Status = 'idle' | 'capturing' | 'verifying' | 'verified' | 'error';

// TODO: Replace with Prembly RN SDK (react-native-identity-kyc) once installed.
// The SDK gives us active liveness (head-turn challenge) which the CBN circular requires.
// Until then, expo-image-picker captures a still selfie and the backend's bvn_w_face /
// nin_w_face endpoints do passive anti-spoof on the submitted image.
// Returns base64 of the captured image, or null if the user cancels.
async function captureSelfie(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Camera permission is required to verify your identity.');
  }

  const result = await ImagePicker.launchCameraAsync({
    cameraType: ImagePicker.CameraType.front,
    quality: 0.6,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]?.base64) {
    return null;
  }

  return result.assets[0].base64;
}

export default function FaceLivenessScreen() {
  const bvn = useSignUpStore((s) => s.bvn);
  const nin = useSignUpStore((s) => s.nin);
  const bvnData = useSignUpStore((s) => s.bvnData);
  const ninData = useSignUpStore((s) => s.ninData);
  const storedBvnFaceId = useSignUpStore((s) => s.bvnFaceVerificationId);
  const storedNinFaceId = useSignUpStore((s) => s.ninFaceVerificationId);
  const setBvnFaceVerificationId = useSignUpStore((s) => s.setBvnFaceVerificationId);
  const setNinFaceVerificationId = useSignUpStore((s) => s.setNinFaceVerificationId);

  const alreadyVerified = Boolean(storedBvnFaceId && storedNinFaceId);
  const [status, setStatus] = useState<Status>(alreadyVerified ? 'verified' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isCapturing = status === 'capturing';
  const isVerifying = status === 'verifying';
  const isLoading = isCapturing || isVerifying;
  const isError = status === 'error';
  const isVerified = status === 'verified';

  const handleStart = async () => {
    if (isLoading) return;
    if (!bvnData?.verification_id || !ninData?.verification_id) {
      setErrorMsg('Missing BVN or NIN verification. Please go back and complete those steps.');
      setStatus('error');
      return;
    }

    setStatus('capturing');
    setErrorMsg('');

    let image: string | null;
    try {
      image = await captureSelfie();
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Could not open the camera.');
      setStatus('error');
      return;
    }

    if (!image) {
      setStatus('idle');
      return;
    }

    setStatus('verifying');

    // Skip endpoints that already succeeded on a previous attempt — avoids paying
    // for both calls when only one failed and the user is retaking.
    const bvnTask = storedBvnFaceId
      ? Promise.resolve({ bvn_w_face_verification_id: storedBvnFaceId })
      : authService.verifyBvnWithFace(bvnData.verification_id, bvn, image);
    const ninTask = storedNinFaceId
      ? Promise.resolve({ nin_w_face_verification_id: storedNinFaceId })
      : authService.verifyNinWithFace(ninData.verification_id, nin, image);

    const [bvnSettled, ninSettled] = await Promise.allSettled([bvnTask, ninTask]);

    if (bvnSettled.status === 'fulfilled') {
      setBvnFaceVerificationId(bvnSettled.value.bvn_w_face_verification_id);
    }
    if (ninSettled.status === 'fulfilled') {
      setNinFaceVerificationId(ninSettled.value.nin_w_face_verification_id);
    }

    const bvnFailed = bvnSettled.status === 'rejected';
    const ninFailed = ninSettled.status === 'rejected';

    if (bvnFailed || ninFailed) {
      const reasons: string[] = [];
      if (bvnFailed) reasons.push(`BVN: ${bvnSettled.reason?.message ?? 'verification failed'}`);
      if (ninFailed) reasons.push(`NIN: ${ninSettled.reason?.message ?? 'verification failed'}`);
      setErrorMsg(reasons.join(' • '));
      setStatus('error');
      return;
    }

    setStatus('verified');
  };

  const handleContinue = () => {
    router.push('/(sign-up)/mothers-maiden-name');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Verify your identity</Text>
        <Text style={styles.subtitle}>
          We'll take a quick selfie to confirm your face matches your BVN and NIN records.
        </Text>

        {!isVerified && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Before you start:</Text>
            {[
              'Stay in a well-lit area with your face clearly visible.',
              'Remove glasses, hats, or anything covering your face.',
              'Follow the on-screen prompts during capture.',
            ].map((item) => (
              <View key={item} style={styles.bulletRow}>
                <Text style={styles.bullet}>{'•'}</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {isError && errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : null}

        {isVerified && (
          <View style={styles.successCard}>
            <View style={styles.successHeader}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Identity verified</Text>
            </View>
            <Text style={styles.successBody}>
              Your selfie matched the records on your BVN and NIN.
            </Text>
          </View>
        )}

        <View style={styles.spacer} />

        <View style={styles.footer}>
          {isVerified ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Confirm & Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleStart}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.loadingText}>
                    {isCapturing ? 'Opening camera...' : 'Verifying...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isError ? 'Retake Selfie' : 'Start Verification'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
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
  infoBox: {
    backgroundColor: '#EEF0FF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bullet: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  bulletText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    color: ERROR_COLOR,
    marginTop: 12,
  },
  successCard: {
    backgroundColor: '#EEF0FF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: SUCCESS_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: SUCCESS_COLOR,
  },
  successBody: {
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
