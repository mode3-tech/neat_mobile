import { Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

interface ForgotPinLinkProps {
  /** Extra classes, mainly for alignment. Defaults to right-aligned. */
  className?: string;
  /** Use on the navy PIN keypad — the default navy text is invisible there. */
  onDark?: boolean;
}

export function ForgotPinLink({
  className = 'self-end mt-2',
  onDark = false,
}: ForgotPinLinkProps) {
  return (
    <TouchableOpacity
      className={className}
      onPress={() => router.push('/(profile)/forgot-pin-otp' as any)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text
        className={`text-[13px] font-semibold ${
          onDark ? 'text-[#F9B700]' : 'text-[#032252]'
        }`}
      >
        Forgot PIN?
      </Text>
    </TouchableOpacity>
  );
}
