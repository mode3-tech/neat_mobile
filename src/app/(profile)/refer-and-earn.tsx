import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { toast } from 'sonner-native';

import { useAccountSummary } from '@/hooks/use-account-summary';

export default function ReferAndEarnScreen() {
  // Same query key as the Profile tab, so the code is already cached when
  // arriving from there and renders without a loading flash.
  const { data: summary, isLoading } = useAccountSummary();
  const code = summary?.referral_code ?? '';

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    toast.success('Referral code copied');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#472FF8" />
      </SafeAreaView>
    );
  }

  // The Profile row is hidden when there's no code, so this only covers a code
  // going empty while the screen is open, or a direct navigation.
  if (!code) {
    return <Redirect href="/Dashboard/profile" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-gray-200 rounded-full px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm text-gray-700 font-medium">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-[#1A1A1A] mb-1.5">Refer &amp; Earn</Text>
      <Text className="text-[13px] text-gray-500 leading-5 mb-6">
        Share your code with friends and earn cash rewards when they join NEAT.
      </Text>

      <Text className="text-[13px] font-medium text-gray-500 mb-2">Your referral code</Text>
      <View className="bg-[#F5F5F5] rounded-2xl px-4 py-4 flex-row items-center">
        <Text
          className="flex-1 text-[24px] font-bold text-[#1A1A1A]"
          style={{ letterSpacing: 3 }}
          selectable
        >
          {code}
        </Text>
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-[#EEF0FF] items-center justify-center ml-3"
          onPress={handleCopy}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="content-copy" size={18} color="#472FF8" />
        </TouchableOpacity>
      </View>

      <View className="bg-[#EEF0FF] rounded-2xl px-4 py-4 mt-6">
        <Text className="text-[14px] font-semibold text-[#1A1A1A] mb-2">How it works</Text>
        <Text className="text-[13px] text-gray-600 leading-5">
          1. Copy your code and send it to a friend.{'\n'}
          2. They enter it when creating their NEAT account.{'\n'}
          3. Your reward is credited to your wallet once their account qualifies.
        </Text>
      </View>
    </SafeAreaView>
  );
}
