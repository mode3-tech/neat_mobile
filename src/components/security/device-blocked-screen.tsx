import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

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
            backgroundColor: '#EEF0FF',
            marginBottom: 24,
          }}
        >
          <Ionicons name="shield-outline" size={48} color="#472FF8" />
        </View>

        <Text
          className="text-center font-bold"
          style={{ fontSize: 22, color: '#472FF8', marginBottom: 12 }}
        >
          Device Not Secure
        </Text>

        <Text
          className="text-center"
          style={{
            fontSize: 15,
            color: '#000000',
            opacity: 0.75,
            lineHeight: 22,
            marginBottom: 24,
          }}
        >
          For your protection, NeatPay cannot run on devices that have been
          rooted, jailbroken, or modified. This is a banking-grade requirement
          to keep your funds safe.
        </Text>

        <Text
          className="text-center"
          style={{
            fontSize: 13,
            color: '#000000',
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
            borderColor: '#472FF8',
            borderRadius: 50,
            paddingHorizontal: 32,
            paddingVertical: 14,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: '#472FF8', fontSize: 15, fontWeight: '600' }}>
            Contact Support
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
