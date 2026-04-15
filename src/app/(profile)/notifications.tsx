import { useState } from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function NotificationsScreen() {
  const [enabled, setEnabled] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-gray-200 rounded-full px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm text-gray-700 font-medium">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-[#1A1A1A] mb-6">Notification settings</Text>

      <View className="bg-[#F5F5F5] rounded-2xl px-4 py-4 flex-row items-center">
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-[#1A1A1A]">All notifications</Text>
          <Text className="text-[12px] text-gray-500 mt-0.5">Get notified on your activities</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: '#E5E7EB', true: '#472FF8' }}
          thumbColor="#fff"
          ios_backgroundColor="#E5E7EB"
        />
      </View>
    </SafeAreaView>
  );
}
