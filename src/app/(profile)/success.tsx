import { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { colors } from '@/theme/palette';

export default function SuccessScreen() {
  const { title, message } = useLocalSearchParams<{ title?: string; message?: string }>();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <View className="flex-1 items-center justify-center">
        <Animated.View
          style={{ transform: [{ scale }] }}
          className="w-28 h-28 rounded-full bg-success-surface items-center justify-center mb-8"
        >
          <View className="w-20 h-20 rounded-full bg-success items-center justify-center">
            <Ionicons name="checkmark" size={44} color={colors.inkInverse} />
          </View>
        </Animated.View>

        <Animated.Text
          style={{ opacity }}
          className="text-[22px] font-bold text-ink text-center mb-3"
        >
          {title ?? 'Success'}
        </Animated.Text>
        <Animated.Text
          style={{ opacity }}
          className="text-[14px] text-ink-soft text-center leading-[22px] px-4"
        >
          {message ?? ''}
        </Animated.Text>
      </View>

      <View className="pb-4">
        <TouchableOpacity
          className="rounded-full py-4 items-center bg-primary"
          onPress={() => router.replace('/Dashboard/profile' as any)}
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-semibold">Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
