import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { PIN_LENGTH } from '@/constants';
import { BackButton } from '@/components/ui/back-button';
import { ForgotPinLink } from '@/components/ui/forgot-pin-link';
import type { BiometryType } from '@/services/biometric.service';

const NAVY = '#032252';
const ACCENT = '#F9B700';

interface PinKeypadScreenProps {
  /** Bar title. */
  headerTitle?: string;
  title?: string;
  subtitle?: string;
  /** Controlled PIN buffer — the parent owns it so it can clear on failure. */
  value: string;
  onChange: (pin: string) => void;
  /** Fired once the PIN_LENGTH-th digit lands. */
  onComplete: (pin: string) => void;
  /** Parent-owned. Disables the keypad and swaps the boxes for a spinner. */
  submitting?: boolean;
  /** Omit to hide the biometric key entirely. */
  onBiometric?: () => void;
  biometryType?: BiometryType;
  /** Defaults to `router.back()`. */
  onBack?: () => void;
}

// null = the empty cell left of `0`, which the biometric key fills when available.
const KEYS: (string | null)[] = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  null, '0', 'back',
];

// Shadows live in a StyleSheet rather than className: NativeWind's shadow-*
// utilities don't map cleanly to both iOS (shadow*) and Android (elevation),
// and the one existing shadow in this codebase — enable-biometrics.tsx — does
// it the same way.
const styles = StyleSheet.create({
  tray: {
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  activeBox: {
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  key: {
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  biometricKey: {
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
});

/**
 * Full-screen PIN pad used for every transaction authorisation
 * (single transfer, bulk transfer, VAS, loan, savings).
 *
 * It ships its own keypad rather than leaning on the OS keyboard so the whole
 * step fits one screen without scrolling, and its own navy header band rather
 * than <HeaderScreen> — the dashboard greeting that component mounts reads
 * oddly on an authorisation step and eats height the keypad needs.
 *
 * The PIN is masked with dots and there is no reveal toggle: a keypad layout
 * has nowhere sensible to put one.
 */
export function PinKeypadScreen({
  headerTitle = 'Authorize Payment',
  title = 'Enter Transaction Pin',
  subtitle = 'To complete this transaction, enter your transaction PIN',
  value,
  onChange,
  onComplete,
  submitting = false,
  onBiometric,
  biometryType,
  onBack,
}: PinKeypadScreenProps) {
  // Four rows of 84pt keys need ~400pt of height on their own, which overruns
  // a 667pt-tall device once the header, title and tray are stacked above them.
  // Step the whole pad down on short screens rather than letting it clip — the
  // keypad is the one part of this screen that must always be fully reachable.
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const keySize = compact ? 64 : 84;
  const boxWidth = compact ? 52 : 62;
  const boxHeight = compact ? 60 : 74;

  // onComplete fires from here rather than a useEffect on `value`: an effect
  // would re-run on remount and could submit the same transaction twice.
  const handleDigit = (digit: string) => {
    if (submitting || value.length >= PIN_LENGTH) return;
    const next = value + digit;
    onChange(next);
    if (next.length === PIN_LENGTH) onComplete(next);
  };

  const handleBackspace = () => {
    if (submitting || value.length === 0) return;
    onChange(value.slice(0, -1));
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      {/* Navy band — mirrors the DashboardHeader anatomy every other screen
          sits under, and claims the top inset itself so nothing double-insets. */}
      <SafeAreaView className="bg-[#032252]" edges={['top']}>
        <View className="flex-row items-center px-6 pt-2 pb-4">
          <BackButton className="" onDark onPress={onBack} />
          <Text
            className="flex-1 text-center text-[20px] font-bold text-white -ml-8"
            style={{ includeFontPadding: false }}
          >
            {headerTitle}
          </Text>
        </View>
      </SafeAreaView>

      <View className={`px-6 items-center ${compact ? 'pt-6' : 'pt-10'}`}>
        <Text
          className={`font-bold text-[#1A1A1A] text-center ${
            compact ? 'text-[24px]' : 'text-[28px]'
          }`}
        >
          {title}
        </Text>
        <Text className="text-[15px] text-[#6B7280] text-center mt-1.5 leading-[22px]">
          {subtitle}
        </Text>

        {/* PIN tray. The spinner overlays the boxes rather than replacing them
            so the tray keeps its size without a hardcoded width. */}
        <View
          className={`bg-white rounded-2xl p-3 ${compact ? 'mt-5' : 'mt-8'}`}
          style={styles.tray}
        >
          <View className="flex-row gap-2" style={{ opacity: submitting ? 0 : 1 }}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => {
              const filled = i < value.length;
              const isActive = i === value.length;
              return (
                <View
                  key={i}
                  className={`rounded-xl items-center justify-center ${
                    isActive
                      ? 'bg-white border-[1.5px] border-[#F9B700]'
                      : 'bg-[#F5F5F5]'
                  }`}
                  style={[
                    { width: boxWidth, height: boxHeight },
                    isActive && styles.activeBox,
                  ]}
                >
                  {filled && (
                    <Text className="text-[28px] leading-[32px] text-[#032252]">
                      •
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
          {submitting && (
            <View className="absolute inset-0 items-center justify-center">
              <ActivityIndicator size="large" color={NAVY} />
            </View>
          )}
        </View>

        <ForgotPinLink className="self-center mt-5" />
      </View>

      {/* Keypad. Cell height comes from the key itself rather than a percentage
          aspect ratio, so the pad's total height stays predictable. */}
      <View className="flex-1 justify-end px-6 pb-2">
        <View className="flex-row flex-wrap justify-between">
          {KEYS.map((key) => {
            const isBiometric = key === null;
            const isBack = key === 'back';

            // The biometric cell renders as an empty spacer when biometrics
            // aren't available, so `0` stays centred either way.
            if (isBiometric && !onBiometric) {
              return (
                <View
                  key="biometric"
                  className="w-[31%] mb-3"
                  style={{ height: keySize }}
                />
              );
            }

            return (
              <View key={key ?? 'biometric'} className="w-[31%] mb-3 items-center">
                <TouchableOpacity
                  className={`rounded-full items-center justify-center ${
                    isBiometric ? 'bg-[#F9B700]' : 'bg-white'
                  }`}
                  style={[
                    { width: keySize, height: keySize },
                    isBiometric ? styles.biometricKey : styles.key,
                  ]}
                  onPress={() => {
                    if (isBiometric) return onBiometric?.();
                    if (isBack) return handleBackspace();
                    return handleDigit(key as string);
                  }}
                  disabled={submitting}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isBiometric
                      ? 'Authenticate with biometrics'
                      : isBack
                        ? 'Delete'
                        : (key as string)
                  }
                >
                  {isBiometric ? (
                    <MaterialCommunityIcons
                      name={
                        biometryType === 'FACE'
                          ? 'face-recognition'
                          : 'fingerprint'
                      }
                      size={compact ? 26 : 30}
                      color={NAVY}
                    />
                  ) : isBack ? (
                    <MaterialCommunityIcons
                      name="backspace"
                      size={compact ? 22 : 26}
                      color={NAVY}
                    />
                  ) : (
                    <Text
                      className={`font-semibold text-[#032252] ${
                        compact ? 'text-[24px]' : 'text-[28px]'
                      }`}
                      style={{ includeFontPadding: false }}
                    >
                      {key}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
