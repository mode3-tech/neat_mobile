import { ActivityIndicator, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useAccountSummary } from '@/hooks/use-account-summary';
import { BackButton } from '@/components/ui/back-button';
import { HeaderScreen } from '@/components/ui/header-screen';
import { CopyButton } from '@/components/ui/copy-button';

export default function ReferAndEarnScreen() {
  // Same query key as the Profile tab, so the code is already cached when
  // arriving from there and renders without a loading flash.
  const { data: summary, isLoading } = useAccountSummary();
  const code = summary?.referral_code ?? '';

  if (isLoading) {
    return (
      <HeaderScreen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#032252" />
        </View>
      </HeaderScreen>
    );
  }

  // The Profile row is hidden when there's no code, so this only covers a code
  // going empty while the screen is open, or a direct navigation.
  if (!code) {
    return <Redirect href="/Dashboard/profile" />;
  }

  return (
    <HeaderScreen>
      <View className="flex-row items-center gap-2 mt-4 mb-2">
        <BackButton className="" />
        <Text
          className="text-[22px] font-bold text-[#032252] leading-[26px]"
          style={{ includeFontPadding: false }}
        >
          Refer &amp; Earn
        </Text>
      </View>
      <Text className="text-[13px] text-gray-500 leading-5 mb-6">
        Share your code with friends and earn cash rewards when they join NEAT.
      </Text>

      <Text className="text-[13px] font-medium text-gray-500 mb-2">Your referral code</Text>
      <View className="bg-[#F5F5F5] rounded-2xl px-4 py-4 flex-row items-center">
        <Text
          className="flex-1 text-[24px] font-bold text-[#032252]"
          style={{ letterSpacing: 3 }}
          selectable
        >
          {code}
        </Text>
        <CopyButton
          value={code}
          className="w-10 h-10 rounded-full bg-[#F9B700] items-center justify-center ml-3"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
          onCopied={() =>
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
          }
        >
          <MaterialCommunityIcons name="content-copy" size={18} color="#032252" />
        </CopyButton>
      </View>

      <View className="bg-[#E8EEF7] border border-[#032252]/30 rounded-2xl px-4 py-4 mt-6">
        <Text className="text-[14px] font-semibold text-[#032252] mb-2">How it works</Text>
        <Text className="text-[13px] text-[#374151] leading-5">
          1. Copy your code and send it to a friend.{'\n'}
          2. They enter it when creating their NEAT account.{'\n'}
          3. Your reward is credited to your wallet once their account qualifies.
        </Text>
      </View>
    </HeaderScreen>
  );
}
