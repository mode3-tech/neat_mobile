import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

interface BackButtonProps {
  /** Defaults to `router.back()`. */
  onPress?: () => void;
  /** Extra classes, mainly for spacing. Defaults to `mt-4 mb-5`. */
  className?: string;
  /** Use on dark/gradient headers. */
  onDark?: boolean;
}

/**
 * Bare chevron, no bordered box. Screens usually pair it with their heading:
 *
 *   <View className="flex-row items-center gap-2 mt-4 mb-5">
 *     <BackButton className="" />
 *     <Text className="... leading-[26px]" style={{ includeFontPadding: false }}>Title</Text>
 *   </View>
 *
 * The title needs `includeFontPadding: false` and an explicit line height —
 * Android otherwise pads the Text box, which throws the chevron off centre.
 */
export function BackButton({ onPress, className = 'mt-4 mb-5', onDark = false }: BackButtonProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={12}
      activeOpacity={0.7}
      onPress={onPress ?? (() => router.back())}
      // -ml-1.5 pulls the glyph out to the screen's left margin
      className={`h-8 w-8 -ml-1.5 items-center justify-center self-start ${className}`}
    >
      <Feather name="chevron-left" size={22} color={onDark ? '#FFFFFF' : '#1A1A1A'} />
    </TouchableOpacity>
  );
}
