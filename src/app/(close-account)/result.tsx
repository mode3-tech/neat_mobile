import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { Icon } from '@/theme/icons';
import { colors } from '@/theme/palette';

type Variant = 'error' | 'blocked';

export default function CloseAccountResultScreen() {
  const { variant, message } = useLocalSearchParams<{
    variant?: Variant;
    message?: string;
  }>();

  const isBlocked = variant === 'blocked';

  const title = isBlocked ? 'Action needed' : "Couldn't close account";
  const body =
    message ??
    (isBlocked
      ? "Your account can't be closed just yet."
      : 'Something went wrong. Please try again.');
  const buttonLabel = isBlocked ? 'Back to Home' : 'Try Again';

  const handlePress = () => {
    if (isBlocked) {
      router.replace('/Dashboard' as any);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <View className="flex-1 items-center justify-center">
        {isBlocked ? (
          <View className="w-[72px] h-[72px] rounded-full bg-warning items-center justify-center mb-8">
            <Icon name="alert" size={40} color={colors.inkInverse} />
          </View>
        ) : (
          <View className="w-[72px] h-[72px] rounded-2xl bg-danger items-center justify-center mb-8">
            <Icon name="close" size={40} color={colors.inkInverse} />
          </View>
        )}

        <Text
          className={`text-[22px] font-bold text-center mb-3 ${
            isBlocked ? 'text-ink' : 'text-danger'
          }`}
        >
          {title}
        </Text>
        <Text className="text-[14px] text-ink-soft text-center leading-[22px] px-4">
          {body}
        </Text>
      </View>

      <View className="pb-4">
        <TouchableOpacity
          className="rounded-full py-4 items-center bg-primary"
          onPress={handlePress}
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-semibold">{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
