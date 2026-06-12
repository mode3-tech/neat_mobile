import { Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export function ForgotPinLink() {
  return (
    <TouchableOpacity
      className="self-end mt-2"
      onPress={() => router.push('/(profile)/forgot-pin-otp' as any)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text className="text-[13px] text-[#472FF8] font-semibold">Forgot PIN?</Text>
    </TouchableOpacity>
  );
}
