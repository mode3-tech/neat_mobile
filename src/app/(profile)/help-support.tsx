import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/constants';
import { BackButton } from '@/components/ui/back-button';
import { CopyButton } from '@/components/ui/copy-button';
import { HeaderScreen } from '@/components/ui/header-screen';

interface ContactRowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  hint: string;
  onPress: () => void;
  className?: string;
}

function ContactRow({ icon, label, value, hint, onPress, className = '' }: ContactRowProps) {
  return (
    <View className={`flex-row items-center rounded-2xl bg-[#F5F5F5] pr-4 ${className}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint={hint}
        onPress={onPress}
        // Without a long-press handler, Pressable still fires onPress on release,
        // so long-pressing the selectable value to copy it would also dial/compose.
        onLongPress={() => {}}
        className="flex-1 flex-row items-center py-4 pl-4 active:opacity-60"
      >
        <View className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3">
          <MaterialCommunityIcons name={icon} size={20} color="#032252" />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-[#032252]">{label}</Text>
          <Text selectable className="text-[13px] text-gray-500 mt-0.5">
            {value}
          </Text>
        </View>
      </Pressable>
      <CopyButton
        value={value}
        pillPlacement="above"
        className="w-9 h-9 rounded-full bg-white items-center justify-center ml-3"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
        onCopied={() =>
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
        }
      >
        <MaterialCommunityIcons name="content-copy" size={16} color="#032252" />
      </CopyButton>
    </View>
  );
}

export default function HelpSupportScreen() {
  return (
    <HeaderScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="flex-row items-center gap-2 mt-4 mb-2">
          <BackButton className="" />
          <Text
            className="text-[22px] font-bold text-[#032252] leading-[26px]"
            style={{ includeFontPadding: false }}
          >
            Help &amp; Support
          </Text>
        </View>
        <Text className="text-[13px] text-gray-500 leading-5 mb-6">
          Questions about your account or a transaction? Reach us here.
        </Text>

        <ContactRow
          icon="phone-outline"
          label="Call us"
          value={SUPPORT_PHONE}
          hint="Opens your phone app"
          onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {})}
          className="mb-3"
        />
        <ContactRow
          icon="email-outline"
          label="Email us"
          value={SUPPORT_EMAIL}
          hint="Opens your email app"
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}
        />
      </ScrollView>
    </HeaderScreen>
  );
}
