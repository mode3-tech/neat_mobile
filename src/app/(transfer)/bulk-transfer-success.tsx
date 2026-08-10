import { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useBulkTransferStore } from '@/stores/bulk-transfer.store';
import { colors } from '@/theme/palette';

export default function BulkTransferSuccessScreen() {
  const reset = useBulkTransferStore((s) => s.reset);
  // Snapshot the message before clearing the store, so OS back can't land on
  // the review screen with recipients still loaded and re-submit the transfer.
  const [message] = useState(
    () => useBulkTransferStore.getState().resultMessage,
  );
  const hasNavigatedAway = useRef(false);

  const handleBack = () => {
    if (hasNavigatedAway.current) return;
    hasNavigatedAway.current = true;
    router.replace('/(transfer)/bulk-transfer');
  };

  useEffect(() => {
    if (!message) {
      handleBack();
      return;
    }
    reset();
  }, []);

  if (!message) return null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        <TouchableOpacity
          className="self-start border border-line rounded-[20px] px-6 py-1.5 mt-2"
          onPress={handleBack}
        >
          <Text className="text-sm font-medium text-ink-body">Back</Text>
        </TouchableOpacity>

        <View className="flex-1 items-center justify-center">
          <View className="w-16 h-16 rounded-full bg-success items-center justify-center mb-5">
            <MaterialCommunityIcons name="check" size={32} color={colors.inkInverse} />
          </View>
          <Text className="text-[22px] font-bold text-primary text-center mb-2">
            Successful!
          </Text>
          <Text className="text-[14px] text-ink text-center leading-5 px-6">
            {message}
          </Text>
        </View>

        <View className="pb-4">
          <TouchableOpacity
            className="bg-primary rounded-full py-4 items-center"
            onPress={handleBack}
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-semibold">Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
