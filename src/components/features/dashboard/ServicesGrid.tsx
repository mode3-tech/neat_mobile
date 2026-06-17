import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import { vasService } from '@/services/vas.service';
import { useVasStore } from '@/stores/vas.store';

interface ServiceItem {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  route?: string;
  /** VAS category name to resolve a category_id from /vas/categories. */
  categoryName?: string;
}

// Fallback category ids used if /vas/categories hasn't loaded yet.
const CATEGORY_FALLBACK: Record<string, number> = {
  AIRTIME: 1,
  DATA: 2,
  ELECTRICITY: 3,
  'CABLE TV': 5,
};

const CATEGORY_ROUTE: Record<string, string> = {
  AIRTIME: '/(vas)/buy-airtime',
  DATA: '/(vas)/buy-data',
  'CABLE TV': '/(vas)/cable-tv',
  ELECTRICITY: '/(vas)/buy-electricity',
};

const SERVICES: ServiceItem[][] = [
  [
    { icon: 'qrcode-scan', label: 'QR Code' },
    { icon: 'cash-multiple', label: 'Loans', route: '/(loan)/loan-home' },
    { icon: 'file-document-outline', label: 'Statement', route: '/(account)/statement' },
    { icon: 'wifi', label: 'Buy Data', categoryName: 'DATA' },
  ],
  [
    { icon: 'television', label: 'Cable TV', categoryName: 'CABLE TV' },
    { icon: 'flash', label: 'Electricity', categoryName: 'ELECTRICITY' },
    { icon: 'trophy', label: 'Buy Airtime', categoryName: 'AIRTIME' },
    { icon: 'dots-horizontal', label: 'More' },
  ],
];

export default function ServicesGrid() {
  const setCategory = useVasStore((s) => s.setCategory);

  const { data: categories } = useQuery({
    queryKey: [QUERY_KEYS.VAS_CATEGORIES],
    queryFn: vasService.getCategories,
  });

  const openVasCategory = (categoryName: string) => {
    const resolvedId =
      categories?.find((c) => c.name === categoryName)?.id ??
      CATEGORY_FALLBACK[categoryName];
    const route = CATEGORY_ROUTE[categoryName];
    if (!resolvedId || !route) return;
    setCategory(resolvedId, categoryName);
    router.push(route as any);
  };

  const handlePress = (item: ServiceItem) => {
    if (item.categoryName) {
      openVasCategory(item.categoryName);
      return;
    }
    if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <View className="mt-7 px-6">
      <Text className="text-base font-semibold text-gray-900 mb-4">Services Just for You</Text>
      {SERVICES.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row justify-between mb-4">
          {row.map((item) => (
            <TouchableOpacity
              key={item.label}
              className="items-center w-[22%]"
              activeOpacity={0.7}
              onPress={() => handlePress(item)}
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
