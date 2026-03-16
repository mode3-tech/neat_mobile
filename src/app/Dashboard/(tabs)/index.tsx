import { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '@/stores/auth.store';
import BalanceCardCarousel from '@/components/features/dashboard/BalanceCardCarousel';
import ServicesGrid from '@/components/features/dashboard/ServicesGrid';
import PromoCard from '@/components/features/dashboard/PromoCard';
import RecentTransactions from '@/components/features/dashboard/RecentTransactions';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const firstName = user?.firstName ?? 'MJ';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-2 pb-1">
          <View className="flex-row items-center gap-2.5">
            <View className="w-12 h-12 rounded-full bg-[#472FF8] items-center justify-center">
              <Text className="text-white text-base font-bold">{initial}</Text>
            </View>
            <View>
              {/* <Text className="text-xs font-normal text-gray-500">Welcome Back,</Text> */}
              <Text className="text-base font-bold text-gray-900">Hi, {firstName} 👋</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="notifications-outline" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <Image
              source={require('../../../../assets/images/dashboard/logoe.png')}
              className="w-7 h-7"
              resizeMode="contain"
            />
          </View>
        </View>

      
        <BalanceCardCarousel
          balanceVisible={balanceVisible}
          onToggleVisibility={() => setBalanceVisible((v) => !v)}
        />

        {/* Services */}
        <ServicesGrid />

        {/* 1-Tap Payments Banner */}
        {/* <View className="flex-row items-center gap-2 bg-amber-50 rounded-xl p-3.5 mx-6 mt-2">
          <MaterialCommunityIcons name="information" size={20} color="#F59E0B" />
          <Text className="flex-1 text-[13px] text-gray-700">
            You don't have any 1-tap payments set up yet.
          </Text>
        </View> */}

   
        <PromoCard />

       
        <RecentTransactions />
      </ScrollView>
    </SafeAreaView>
  );
}
