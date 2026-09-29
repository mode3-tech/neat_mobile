import { useEffect } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
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
  /** Parent-owned. Disables the keypad, swaps the boxes for a spinner and blocks leaving the screen. */
  submitting?: boolean;
  /** Disables the keypad but keeps the boxes visible, e.g. while the OS biometric prompt is open. */
  disabled: boolean;
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
 *
 * Every caller has to wire the same pieces; copy an existing screen rather
 * than starting fresh:
 * - `disabled={authenticating}` from useBiometricAuth, so digits can't land
 *   while the OS prompt is open.
 * - A `useRef` re-entry guard at the top of the submit function. `submitting`
 *   is state and lags a render, so it can't stop a same-frame double submit.
 * - If the screen leaves with `router.replace`, reset `submitting` on the
 *   failure path only; re-rendering during teardown can crash Fabric. If it
 *   uses `router.push`, reset it in `finally`: the screen stays mounted
 *   underneath and must work again when the user comes back.
 * Adding a sixth caller is the point to fold this into a shared helper instead.
 */
export function PinKeypadScreen({
  headerTitle = 'Authorize Payment',
  title = 'Enter Transaction Pin',
  subtitle = 'To complete this transaction, enter your transaction PIN',
  value,
  onChange,
  onComplete,
  submitting = false,
  disabled,
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
  const locked = submitting || disabled;
  const navigation = useNavigation();

  // A sent request can't be cancelled, so leaving mid-submit only hides it:
  // the debit still lands, and the parent's success/failure navigation then
  // fires over whatever screen the user moved on to.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !submitting });
    if (!submitting) return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => subscription.remove();
  }, [navigation, submitting]);

  // onComplete fires from here rather than a useEffect on `value`: an effect
  // would re-run on remount and could submit the same transaction twice.
  const handleDigit = (digit: string) => {
    if (locked || value.length >= PIN_LENGTH) return;
    const next = value + digit;
    onChange(next);
    if (next.length === PIN_LENGTH) onComplete(next);
  };

  const handleBackspace = () => {
    if (locked || value.length === 0) return;
    onChange(value.slice(0, -1));
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      {/* Navy band — mirrors the DashboardHeader anatomy every other screen
          sits under, and claims the top inset itself so nothing double-insets. */}
      <SafeAreaView className="bg-[#032252]" edges={['top']}>
        <View className="flex-row items-center px-6 pt-2 pb-4">
          <BackButton
            className=""
            onDark
            onPress={onBack}
            disabled={submitting}
          />
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
          {/* collapsable={false} is load-bearing. With opacity 1 this View has
              nothing to distinguish it, so Fabric flattens it away and hoists
              the boxes into the tray; toggling to opacity 0 forces an unflatten
              that re-parents them mid-transaction. When the caller navigates
              away in the same tick that crashes the mount pass with
              "addViewAt: ... View already has a parent". */}
          <View
            className="flex-row gap-2"
            collapsable={false}
            style={{ opacity: submitting ? 0 : 1 }}
          >
            {Array.from({ length: PIN_LENGTH }).map((_, i) => {
              const filled = i < value.length;
              const isActive = !locked && i === value.length;
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

        <ForgotPinLink className="self-center mt-5" disabled={submitting} />
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
                {/* TouchableOpacity animates to its style opacity whenever that
                    changes, so opacity-40 fades the pad in and out on its own. */}
                <TouchableOpacity
                  className={`rounded-full items-center justify-center ${
                    isBiometric ? 'bg-[#F9B700]' : 'bg-white'
                  } ${locked ? 'opacity-40' : ''}`}
                  style={[
                    { width: keySize, height: keySize },
                    isBiometric ? styles.biometricKey : styles.key,
                  ]}
                  onPress={() => {
                    if (isBiometric) return onBiometric?.();
                    if (isBack) return handleBackspace();
                    return handleDigit(key as string);
                  }}
                  disabled={locked}
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
