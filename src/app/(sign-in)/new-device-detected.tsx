import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';

export default function NewDeviceDetectedScreen() {
  const params = useLocalSearchParams<{
    session_token: string;
    phone: string;
    password: string;
  }>();
  const sessionToken = Array.isArray(params.session_token)
    ? params.session_token[0]
    : params.session_token;

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace({
        pathname: '/(sign-in)/new-device-otp',
        params: {
          session_token: sessionToken,
          phone: params.phone,
          password: params.password,
        },
      });
    }, 4000);
    return () => clearTimeout(timer);
  }, [sessionToken, params.phone, params.password]);

  return ( 
    <View className="flex-1 bg-[#F5F5F5]">
      {/* Top section - light bg with centered image */}
      <View className="flex-[0.65] justify-end items-center">
        <Image
          source={require('../../../assets/images/device.png')}
          className="w-[380px] h-[380px] -mb-12 z-10"
          resizeMode="contain"
        />
      </View>

      {/* Bottom card */}
      <View className="flex-[0.45] rounded-t-3xl overflow-hidden">
        <LinearGradient
          colors={['#2A1B6A', '#0D0B2E']}
          style={{ flex: 1 }}
          className="px-8 pt-20 items-center"
        >
          <Text className="text-[32px] font-extrabold text-white text-center mb-4">
            New Device{'\n'}Detected
          </Text>
          <Text className="text-sm text-[#B0B0C0] text-center leading-[22px]">
            You're trying to log in from a new device.{'\n'}
            For security, we need to verify it's you.
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}
