import {
  Alert,
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface FundingOption {
  image: ImageSourcePropType;
  label: string;
  description: string;
  onPress: () => void;
}

const FUNDING_OPTIONS: FundingOption[] = [
  {
    image: require('../../../assets/images/deposit/Barnk.png'),
    label: 'Bank Transfer',
    description: 'Pay fast and securely.',
    onPress: () => router.push('/(savings)/bank-transfer'),
  },
  {
    image: require('../../../assets/images/deposit/Card.png'),
    label: 'Debit Card',
    description: 'Instant transfer',
    onPress: () =>
      Alert.alert('Coming Soon', 'Debit card deposits will be available soon.'),
  },
  {
    image: require('../../../assets/images/deposit/Cards.png'),
    label: 'From Main Balance',
    description: 'Transfer from wallet',
    onPress: () => router.push('/(savings)/enter-amount'),
  },
];

export default function AddMoneyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-[#374151]">Back</Text>
      </TouchableOpacity>

      <Text className="text-[22px] font-bold text-[#1A1A1A] mb-1">
        Add Money to Savings
      </Text>
      <Text className="text-[13px] text-[#6B7280] mb-7">
        Choose funding method
      </Text>

      <View className="bg-[#EEF0FF] rounded-2xl p-4 gap-3">
        {FUNDING_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.label}
            className="flex-row items-center bg-white rounded-xl px-4 py-4"
            activeOpacity={0.7}
            onPress={option.onPress}
          >
            <Image
              source={option.image}
              className="w-10 h-10 mr-3"
              resizeMode="contain"
            />

            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-[#1A1A1A]">
                {option.label}
              </Text>
              <Text className="text-[12px] text-[#6B7280] mt-0.5">
                {option.description}
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}
