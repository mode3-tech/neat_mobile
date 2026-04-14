import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface ServiceItem {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  route?: string;
}

const SERVICES: ServiceItem[][] = [
  [
    { icon: 'send', label: 'Send Bulk' },
    { icon: 'qrcode-scan', label: 'QR Code' },
    { icon: 'cash-multiple', label: 'Loans', route: '/(loan)/loan-home' },
    { icon: 'piggy-bank', label: 'NeatSave' },
    { icon: 'file-document-outline', label: 'Statement', route: '/(account)/statement' },
  ],
  [
    { icon: 'wifi', label: 'Buy Data' },
    { icon: 'television', label: 'Cable TV' },
    { icon: 'flash', label: 'Electricity' },
    { icon: 'trophy', label: 'Betting' },
    { icon: 'dots-horizontal', label: 'More' },
  ],
];

export default function ServicesGrid() {
  return (
    <View className="mt-7 px-6">
      <Text className="text-base font-semibold text-gray-900 mb-4">Services Just for You</Text>
      {SERVICES.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row justify-between mb-4">
          {row.map((item) => (
            <TouchableOpacity
              key={item.label}
              className="items-center w-[18%]"
              activeOpacity={0.7}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View className="w-12 h-12 rounded-full bg-[#472FF8] items-center justify-center">
                <MaterialCommunityIcons name={item.icon} size={22} color="#FFFFFF" />
              </View>
              <Text className="text-[10px] text-gray-700 text-center mt-1.5" numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}
