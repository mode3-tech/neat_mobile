import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useBiometricSignIn } from '@/hooks/use-biometric-sign-in';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { getErrorMessage } from '@/utils/error';

const PRIMARY = '#472FF8';

export default function SignInScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    isBiometricSignInReady,
    biometryType,
    authenticating: biometricLoading,
    signInWithBiometric,
  } = useBiometricSignIn();

  const canSignIn = phone.trim().length > 0 && password.length > 0;

  const handleSignIn = async () => {
    if (!canSignIn || loading) return;
    setLoading(true);
    try {
      const response = await authService.loginUser(phone.trim(), password);

      if (response.status === 'success' && response.access_token && response.refresh_token) {
        const { setTokens, setUser, setBiometricsEnabled } = useAuthStore.getState();
        setTokens(response.access_token, response.refresh_token);
        if (response.user) setUser(response.user);

        // Sync biometrics preference from backend (source of truth)
        if (typeof response.is_biometrics_enabled === 'boolean') {
          setBiometricsEnabled(response.is_biometrics_enabled);
        }

        router.replace('/Dashboard' as any);
        return;
      }

      if (response.status === 'new_device_detected') {
        if (!response.session_token) {
          toast.error('Sign in failed', {
            description: 'Server error: missing session token',
          });
          return;
        }
        router.push({
          pathname: '/(sign-in)/new-device-detected',
          params: { session_token: response.session_token },
        });
        return;
      }

      toast.error('Sign in failed', {
        description: 'Unexpected response from server',
      });
    } catch (err: unknown) {
      toast.error('Sign in failed', { description: getErrorMessage(err) });
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
          <View style={styles.logoWrap}>
            <Image
              source={require('../../../assets/images/sign.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            {/* <Text style={styles.brandName}>
              Neat<Text style={styles.brandAccent}>pays</Text>
            </Text>
            <Text style={styles.tagline}>Let's get you In</Text> */}
          </View>

        
          <View style={styles.field}>
            <Text style={styles.label}>Phone number</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>
          </View>

         
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
              </TouchableOpacity>
            </View>
          </View>

         
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push('/(sign-in)/forgot-password')}
          >
            <Text style={styles.forgotText}>Forgot Password</Text>
          </TouchableOpacity>

          <View style={styles.spacer} />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.primaryBtn, !canSignIn && styles.disabledBtn]}
              onPress={handleSignIn}
              // onPress={()=> router.replace('/Dashboard' as any)}
              disabled={!canSignIn || loading || biometricLoading}
              activeOpacity={0.85}

            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.primaryBtnText, !canSignIn && styles.disabledBtnText]}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(sign-up)/bvn-verification')}
              activeOpacity={0.7}
            >
              <Text style={styles.signUpText}>
                Don't have an accounters?{' '}
                <Text style={styles.signUpLink}>Sign up</Text>
              </Text>
            </TouchableOpacity>

            {isBiometricSignInReady && (
              <TouchableOpacity
                style={styles.biometricBtn}
                activeOpacity={0.7}
                disabled={biometricLoading || loading}
                onPress={async () => {
                  const result = await signInWithBiometric();
                  if (result.status === 'success') {
                    router.replace('/Dashboard' as any);
                  } else if (result.status === 'new_device') {
                    router.push({
                      pathname: '/(sign-in)/new-device-detected',
                      params: { session_token: result.sessionToken },
                    });
                  } else if (result.status === 'failed') {
                    toast.error('Sign in failed', {
                      description: result.error || 'Please try again.',
                    });
                  }
                }}
              >
                {biometricLoading ? (
                  <ActivityIndicator size="small" color={PRIMARY} />
                ) : (
                  <MaterialCommunityIcons
                    name={biometryType === 'FACE' ? 'face-recognition' : 'fingerprint'}
                    size={24}
                    color={PRIMARY}
                  />
                )}
                <Text style={styles.biometricText}>
                  {biometricLoading
                    ? 'Signing in...'
                    : `Sign in with ${biometryType === 'FACE' ? 'Face ID' : 'fingerprint'}`}
                </Text>
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
  logoWrap: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 12,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  brandAccent: {
    color: PRIMARY,
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
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
  spacer: {
    flex: 1,
    minHeight: 32,
  },
  forgotBtn: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
  },
  footer: {
    gap: 16,
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
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 50,
    paddingVertical: 14,
  },
  biometricText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  signUpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center' as const,
  },
  signUpLink: {
    color: PRIMARY,
    fontWeight: '600' as const,
  },


});
