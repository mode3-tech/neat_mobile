import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { toast } from 'sonner-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { NavBar } from '@/components/ui/nav-bar';
import { useBiometricSignIn } from '@/hooks/use-biometric-sign-in';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { getErrorMessage } from '@/utils/error';
import { maskPhone } from '@/utils/mask';

const PRIMARY = '#F9B700';
const SPRING = { damping: 18, stiffness: 320 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PressScale({
  onPress,
  disabled,
  children,
}: {
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={animatedStyle}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}

export default function WelcomeBackScreen() {
  const insets = useSafeAreaInsets();
  const rememberedAccount = useAuthStore((s) => s.rememberedAccount);
  const switchAccount = useAuthStore((s) => s.switchAccount);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    isBiometricSignInReady,
    biometryType,
    authenticating: biometricLoading,
    signInWithBiometric,
  } = useBiometricSignIn();

  const autoPrompted = useRef(false);

  const handleBiometric = useCallback(async () => {
    const result = await signInWithBiometric();
    if (result.status === 'success') {
      router.replace('/Dashboard' as any);
    } else if (result.status === 'new_device') {
      router.push({
        pathname: '/(sign-in)/new-device-detected',
        params: { session_token: result.sessionToken },
      });
    } else if (result.status === 'failed') {
      toast.error('Sign in failed', { description: result.error || 'Please try again.' });
    }
  }, [signInWithBiometric]);

  // Auto-prompt once the hook reports readiness. A cancel falls through to the
  // password field rather than re-prompting.
  useEffect(() => {
    if (!isBiometricSignInReady || autoPrompted.current) return;
    autoPrompted.current = true;
    handleBiometric();
  }, [isBiometricSignInReady, handleBiometric]);

  if (!rememberedAccount) {
    return <Redirect href="/(sign-in)/sign-in" />;
  }

  const canSignIn = password.length > 0;
  const busy = loading || biometricLoading;

  const handleSignIn = async () => {
    if (!canSignIn || busy) return;
    setLoading(true);
    try {
      const response = await authService.loginUser(rememberedAccount.phone, password);

      if (response.status === 'success' && response.access_token && response.refresh_token) {
        const { setTokens, setUser, setBiometricsEnabled } = useAuthStore.getState();
        setTokens(response.access_token, response.refresh_token);
        if (response.user) setUser(response.user);
        if (typeof response.is_biometrics_enabled === 'boolean') {
          setBiometricsEnabled(response.is_biometrics_enabled);
        }
        router.replace('/Dashboard' as any);
        return;
      }

      if (response.status === 'new_device_detected') {
        if (!response.session_token) {
          toast.error('Sign in failed', { description: 'Server error: missing session token' });
          return;
        }
        router.push({
          pathname: '/(sign-in)/new-device-detected',
          params: { session_token: response.session_token },
        });
        return;
      }

      toast.error('Sign in failed', { description: 'Unexpected response from server' });
    } catch (err: unknown) {
      toast.error('Sign in failed', { description: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    if (busy) return;
    // Navigate first: clearing the account re-renders this screen into its
    // <Redirect> branch, which would race the replace below.
    router.replace('/(sign-in)/sign-in');
    await switchAccount();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#032252]" edges={['top', 'left', 'right']}>
      <NavBar style="light" />
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        <Animated.View
          entering={FadeIn.duration(320)}
          collapsable={false}
          className="items-center mt-6"
        >
          <Image
            source={require('../../../assets/images/welcome/NeatLogo.png')}
            className="w-32 h-32"
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(420).delay(60).springify().damping(18)}
          collapsable={false}
          className="mt-2 mb-9"
        >
          <Text className="text-[26px] font-bold text-white" numberOfLines={1}>
            Welcome back, {rememberedAccount.firstName || 'there'}
          </Text>
          <Text className="mt-2 text-[13px] font-medium tracking-wide text-[#8D93A1]">
            {maskPhone(rememberedAccount.phone)}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(420).delay(120).springify().damping(18)}
          collapsable={false}
        >
          <Text className="mb-2 text-[13px] font-semibold text-[#B4BAC4]">Password</Text>
          <View className="flex-row items-center rounded-xl border-[1.5px] border-[#8D8D8D] px-4 py-[15px]">
            <TextInput
              className="flex-1 p-0 text-[15px] text-[#B4BAC4]"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleSignIn}
            />
            <Pressable
              hitSlop={10}
              onPress={() => setShowPassword((v) => !v)}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#9CA3AF"
              />
            </Pressable>
          </View>

          <Pressable
            className="mt-3 self-start active:opacity-60"
            onPress={() => router.push('/(sign-in)/forgot-password')}
          >
            <Text className="text-[13px] font-semibold text-[#B4BAC4]">Forgot Password</Text>
          </Pressable>
        </Animated.View>

        <View className="min-h-8 flex-1" />

        <View style={{ paddingBottom: insets.bottom }} className="gap-4">
          <PressScale onPress={handleSignIn} disabled={!canSignIn || busy}>
            <View
              className={`items-center rounded-full py-4 ${
                canSignIn && !busy ? 'bg-[#F9B700]' : 'bg-[#E5E7EB]'
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#032252" />
              ) : (
                <Text
                  className={`text-base font-semibold ${
                    canSignIn && !busy ? 'text-[#032252]' : 'text-[#9CA3AF]'
                  }`}
                >
                  Sign In
                </Text>
              )}
            </View>
          </PressScale>

          {isBiometricSignInReady && (
            <PressScale onPress={handleBiometric} disabled={busy}>
              <View className="flex-row items-center justify-center gap-2 rounded-full border-[1.5px] border-[#F9B700] py-[14px]">
                {biometricLoading ? (
                  <ActivityIndicator size="small" color={PRIMARY} />
                ) : (
                  <MaterialCommunityIcons
                    name={biometryType === 'FACE' ? 'face-recognition' : 'fingerprint'}
                    size={24}
                    color={PRIMARY}
                  />
                )}
                <Text className="text-sm font-medium text-[#B4BAC4]">
                  {biometricLoading
                    ? 'Signing in...'
                    : `Use ${biometryType === 'FACE' ? 'Face ID' : 'fingerprint'}`}
                </Text>
              </View>
            </PressScale>
          )}

          <Pressable
            className="self-center py-1 active:opacity-60"
            disabled={busy}
            onPress={handleSwitchAccount}
          >
            <Text className="text-sm text-[#8D93A1]">
              Not you? <Text className="font-semibold text-[#F9B700]">Switch account</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
