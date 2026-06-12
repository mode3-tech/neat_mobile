import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface SessionExpiredCardProps {
  message: string;
}

export function SessionExpiredCard({ message }: SessionExpiredCardProps) {
  return (
    <SafeAreaView className="flex-1 bg-white px-6 justify-center items-center">
      <View className="bg-[#FEF2F2] rounded-2xl px-6 py-8 items-center w-full">
        <Text className="text-lg font-bold text-[#1A1A1A] mb-2">Session Expired</Text>
        <Text className="text-[13px] text-gray-500 text-center leading-5 mb-6">{message}</Text>
        <TouchableOpacity
          className="bg-[#472FF8] rounded-full py-3.5 px-10"
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Text className="text-white text-sm font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
