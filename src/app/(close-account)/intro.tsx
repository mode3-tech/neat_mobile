import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

function Bullet({ text }: { text: string }) {
  return (
    <View className="flex-row mb-4">
      <Text className="text-[15px] text-[#374151] mr-2 leading-6">{'•'}</Text>
      <Text className="flex-1 text-[15px] text-[#374151] leading-6">{text}</Text>
    </View>
  );
}

export default function CloseAccountIntroScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#F3F4F6]" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-6 pt-2 pb-4 bg-white">
        <TouchableOpacity
          className="border border-gray-200 rounded-full w-10 h-10 items-center justify-center"
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-[#1A1A1A] mr-10">
          Close Account
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Warning badge */}
        <View className="items-center mt-6 mb-6">
          <View className="w-16 h-16 rounded-full bg-[#EF4444] items-center justify-center">
            <MaterialCommunityIcons name="exclamation-thick" size={34} color="#fff" />
          </View>
        </View>

        <Text className="text-center text-[17px] font-bold text-[#1A1A1A] mb-5">
          After Successful Account Cancellation:
        </Text>

        {/* Consequences card */}
        <View className="bg-white rounded-2xl px-5 py-5">
          <Bullet text="Permanently unable to log in or use your account" />
          <Bullet text="Your ID, account and transaction information will be cleared" />
          <View className="flex-row">
            <Text className="text-[15px] text-[#374151] mr-2 leading-6">{'•'}</Text>
            <Text className="flex-1 text-[15px] text-[#374151] leading-6">
              All rewards, referral bonuses and saved beneficiaries will be cleared
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="px-6 pt-2 pb-4">
        <Text className="text-[13px] text-gray-400 leading-5 mb-4">
          For more details on Account Cancellation, please refer to{' '}
          <Text
            className="text-[#472FF8] font-medium"
            onPress={() => router.push('/(close-account)/notice' as any)}
          >
            &lsquo;NEATPay Account Cancellation Notice&rsquo;
          </Text>
        </Text>

        <TouchableOpacity
          className="rounded-full py-4 items-center bg-[#472FF8]"
          onPress={() => router.push('/(close-account)/reason' as any)}
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-semibold">Confirm and Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
