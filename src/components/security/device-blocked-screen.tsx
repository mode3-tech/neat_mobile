import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Icon } from '@/theme/icons';
import { colors } from '@/theme/palette';
import { weight } from '@/theme/typography';

const SUPPORT_EMAIL = 'support@neatpay.ng';

export function DeviceBlockedScreen(): React.JSX.Element {
  const storeName = Platform.OS === 'ios' ? 'App Store' : 'Google Play Store';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View
        className="flex-1 items-center justify-center"
        style={{ paddingHorizontal: 24 }}
      >
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: 96,
            height: 96,
            backgroundColor: colors.primarySurface,
            marginBottom: 24,
          }}
        >
          <Icon name="shield" size={48} color={colors.primary} />
        </View>

        <Text
          className="text-center font-bold"
          style={{ fontSize: 22, color: colors.primary, marginBottom: 12 }}
        >
          Device Not Secure
        </Text>

        <Text
          className="text-center"
          style={{
            fontSize: 15,
            color: colors.overlay,
            opacity: 0.75,
            lineHeight: 22,
            marginBottom: 24,
          }}
        >
          For your protection, NeatPay can't run on devices that have been
          rooted, jailbroken, or modified. This helps keep your account and
          funds safe.
        </Text>

        <Text
          className="text-center"
          style={{
            fontSize: 13,
            color: colors.overlay,
            opacity: 0.5,
            lineHeight: 20,
            marginBottom: 40,
          }}
        >
          {`If you believe this is an error, please reinstall NeatPay from the ${storeName} on a standard, unmodified device.`}
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {
              // Mail client not configured — silently no-op. Block stays in place.
            });
          }}
          style={({ pressed }) => ({
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: 50,
            paddingHorizontal: 32,
            paddingVertical: 14,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: colors.primary, fontSize: 15, ...weight.semibold }}>
            Contact Support
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
