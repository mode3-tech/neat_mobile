import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface ActionItemProps {
  icon: string;
  label: string;
  onPress?: () => void;
}

function ActionItem({ icon, label, onPress }: ActionItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center justify-between bg-[#F9FAFB] rounded-[14px] px-4 py-[18px]"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center gap-[14px]">
        <Text className="text-xl">{icon}</Text>
        <Text className="text-[15px] font-medium text-[#1A1A1A]">{label}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#472FF8" />
    </TouchableOpacity>
  );
}

export default function LoanHomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-[#374151]">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-[#1A1A1A] mb-1">Loans</Text>
      <Text className="text-[13px] text-[#6B7280] mb-5">Manage your loans and applications</Text>

      <View className="bg-[#472FF8] rounded-2xl p-6 mb-7 flex-row items-center justify-between">
        <View>
          <Text className="text-sm text-white/80 mb-2">Outstanding Balance</Text>
          <Text className="text-[28px] font-bold text-white">₦ 0.00</Text>
        </View>
        <Image
          source={require('../../../assets/images/pig.png')}
          className="w-[100px] h-[100px]"
          resizeMode="contain"
        />
      </View>

      <View className="gap-3">
        <ActionItem
          icon="📋"
          label="Apply New Loan"
          onPress={() => router.push('/(loan)/loan-eligibility')}
        />
        <ActionItem
          icon="📅"
          label="Repayment Schedule"
          onPress={() => router.push('/(loan)/repayment-schedule')}
        />
        <ActionItem icon="💰" label="Loan History" />
      </View>
    </SafeAreaView>
  );
}
