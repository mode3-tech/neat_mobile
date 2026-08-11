import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';

import { images } from '@/theme/images';
import { colors } from '@/theme/palette';

export default function NewDeviceDetectedScreen() {
  const params = useLocalSearchParams<{ session_token: string }>();
  const sessionToken = Array.isArray(params.session_token)
    ? params.session_token[0]
    : params.session_token;

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace({
        pathname: '/(sign-in)/new-device-otp',
        params: { session_token: sessionToken },
      });
    }, 4000);
    return () => clearTimeout(timer);
  }, [sessionToken]);

  return ( 
    <View className="flex-1 bg-surface-input">
     
      <View className="flex-[0.65] justify-end items-center">
        <Image
          source={images.deviceVerify}
          className="w-[380px] h-[380px] -mb-12 z-10"
          resizeMode="contain"
        />
      </View>

      {/* Bottom card */}
      <View className="flex-[0.45] rounded-t-3xl overflow-hidden">
        <LinearGradient
          colors={[colors.primaryDark, colors.primaryDeep]}
          style={{ flex: 1 }}
          className="px-8 pt-20 items-center"
        >
          <Text className="text-[32px] font-extrabold text-white text-center mb-4">
            New Device{'\n'}Detected
          </Text>
          <Text className="text-sm text-legacy-text-faint text-center leading-[22px]">
            You're trying to log in from a new device.{'\n'}
            For security, we need to verify it's you.
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}
