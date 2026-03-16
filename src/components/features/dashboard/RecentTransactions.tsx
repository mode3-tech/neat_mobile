import { Image, Text, TouchableOpacity, View } from 'react-native';

export default function RecentTransactions() {
  return (
    <View className="mt-2 px-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-base font-semibold text-gray-900">Recent Transactions</Text>
        <TouchableOpacity>
          <Text className="text-[13px] font-semibold text-[#472FF8]">View Alls</Text>
        </TouchableOpacity>
      </View>

      <View className="items-center pt-6">
        <Image
          source={require('../../../../assets/images/dashboard/phone.png')}
          className="w-[240px] h-[240px]"
          resizeMode="contain"
        />
      </View>
    </View>
  );
}
