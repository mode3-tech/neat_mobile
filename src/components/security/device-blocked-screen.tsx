import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const SUPPORT_PHONE = '+2347070192526';
const SUPPORT_EMAIL = 'customerservice@neatmicrocredit.com.ng';

export function DeviceBlockedScreen(): React.JSX.Element {
  const storeName = Platform.OS === 'ios' ? 'App Store' : 'Google Play Store';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      {/* Scrolls rather than centering in a fixed box: the contact block below
          is the last item, so on a short screen — or at a large font scale — an
          unscrollable container would clip exactly the details the user needs. */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingVertical: 24,
        }}
      >
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: 96,
            height: 96,
            backgroundColor: '#E8EEF7',
            marginBottom: 24,
          }}
        >
          <Ionicons name="shield-outline" size={48} color="#032252" />
        </View>

        <Text
          className="text-center font-bold"
          style={{ fontSize: 22, color: '#032252', marginBottom: 12 }}
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
          For your protection, NeatPay can't run on devices that have been
          rooted, jailbroken, or modified. This helps keep your account and
          funds safe.
        </Text>

        <Text
          className="text-center"
          style={{
            fontSize: 13,
            color: '#000000',
            opacity: 0.5,
            lineHeight: 20,
            marginBottom: 32,
          }}
        >
          {`If you believe this is an error, please reinstall NeatPay from the ${storeName} on a standard, unmodified device.`}
        </Text>

        {/* Call first: tel: resolves on any phone, while mailto: rejects when
            no mail client is configured. Both handlers fail silently, so the
            raw details below are the guaranteed path off this dead end. */}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {
              // No dialer — the number is shown as text below.
            });
          }}
          style={({ pressed }) => ({
            backgroundColor: '#F9B700',
            borderRadius: 50,
            paddingHorizontal: 32,
            paddingVertical: 14,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: '#032252', fontSize: 15, fontWeight: '600' }}>
            Call Support
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {
              // Mail client not configured — the address is shown as text below.
            });
          }}
          style={({ pressed }) => ({
            borderWidth: 1,
            borderColor: '#032252',
            borderRadius: 50,
            paddingHorizontal: 32,
            paddingVertical: 14,
            marginTop: 12,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: '#032252', fontSize: 15, fontWeight: '600' }}>
            Email Support
          </Text>
        </Pressable>

        <Text
          selectable
          className="text-center"
          style={{
            fontSize: 13,
            color: '#000000',
            opacity: 0.5,
            lineHeight: 20,
            marginTop: 24,
          }}
        >
          {`${SUPPORT_PHONE}\n${SUPPORT_EMAIL}`}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
