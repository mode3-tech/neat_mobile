import {
  ActivityIndicator,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { useTransactions } from '@/hooks/use-transactions';
import { TransactionRow } from '@/components/features/transaction/TransactionRow';
import type { TransactionFilter, Transaction } from '@/types/transaction.types';

const FILTERS: { key: TransactionFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'credit', label: 'Credit' },
  { key: 'debit', label: 'Debit' },
];

function FilterTabs({
  active,
  onChange,
}: {
  active: TransactionFilter;
  onChange: (f: TransactionFilter) => void;
}) {
  return (
    <View className="flex-row gap-3 px-6 mt-4 mb-2">
      {FILTERS.map((f) => {
        const isActive = active === f.key;
        return (
          <TouchableOpacity
            key={f.key}
            className={`px-5 py-2 rounded-full ${
              isActive
                ? 'bg-[#472FF8]'
                : 'border border-[#E5E7EB]'
            }`}
            onPress={() => onChange(f.key)}
          >
            <Text
              className={`text-[13px] font-semibold ${
                isActive ? 'text-white' : 'text-[#374151]'
              }`}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <MaterialCommunityIcons
        name={isFiltered ? 'magnify' : 'receipt'}
        size={64}
        color="#E5E7EB"
      />
      <Text className="text-base font-semibold text-[#1A1A1A] mt-4">
        {isFiltered ? 'No matching transactions' : 'No transactions yet'}
      </Text>
      <Text className="text-[13px] text-[#6B7280] text-center mt-1">
        {isFiltered
          ? 'Try adjusting your search or filter.'
          : 'Your transactions will appear here.'}
      </Text>
    </View>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <MaterialCommunityIcons name="wifi-off" size={64} color="#E5E7EB" />
      <Text className="text-base font-semibold text-[#1A1A1A] mt-4">
        {message}
      </Text>
      <Text className="text-[13px] text-[#6B7280] text-center mt-1">
        Pull down to try again
      </Text>
    </View>
  );
}

export default function TransactionScreen() {
  const {
    sections,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    isFiltered,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    isRefetching,
    handleEndReached,
    handleRefresh,
  } = useTransactions();

  const errorMessage = isError
    ? (error as any)?.response?.data?.error ||
      error?.message ||
      'Something went wrong'
    : '';

  return (
    <View className="flex-1 bg-white">
      {/* Gradient Header */}
      <LinearGradient colors={['#0D0B2E', '#472FF8']}>
        <SafeAreaView edges={['top']}>
          <View className="px-6 pt-2 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              {router.canGoBack() ? (
                <TouchableOpacity
                  className="border border-white/30 rounded-[20px] px-4 py-1.5"
                  onPress={() => router.back()}
                >
                  <Text className="text-sm font-medium text-white">Back</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              <MaterialCommunityIcons
                name="swap-vertical"
                size={22}
                color="white"
              />
            </View>
            <Text className="text-xl font-bold text-white">
              Transaction History
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Search Bar */}
      <View className="mx-6 mt-4 bg-[#F5F5F5] rounded-xl px-4 py-3 flex-row items-center">
        <TextInput
          className="flex-1 text-[15px] text-[#1A1A1A] p-0"
          placeholder="Search"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
      </View>

      {/* Filter Tabs */}
      <FilterTabs active={filter} onChange={setFilter} />

      {/* Transaction List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#472FF8" />
        </View>
      ) : isError && sections.length === 0 ? (
        <SectionList
          sections={[]}
          renderItem={() => null}
          ListEmptyComponent={<ErrorState message={errorMessage} />}
          contentContainerStyle={{ flex: 1 }}
          refreshing={isRefetching}
          onRefresh={handleRefresh}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item: Transaction) => item.id}
          renderSectionHeader={({ section }) => (
            <Text className="text-xs font-semibold text-gray-500 px-6 pt-5 pb-2">
              {section.title}
            </Text>
          )}
          renderItem={({ item }: { item: Transaction }) => (
            <TransactionRow transaction={item} />
          )}
          ListEmptyComponent={<EmptyState isFiltered={isFiltered} />}
          contentContainerStyle={
            sections.length === 0 ? { flex: 1 } : { paddingBottom: 20 }
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={handleRefresh}
          stickySectionHeadersEnabled={false}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#472FF8" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
