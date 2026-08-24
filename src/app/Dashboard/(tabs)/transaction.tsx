import {
  ActivityIndicator,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { HeaderScreen } from '@/components/ui/header-screen';

import { useTransactions } from '@/hooks/use-transactions';
import { openTransactionDetails } from '@/utils/transaction-nav';
import { TransactionRow } from '@/components/features/transaction/TransactionRow';
import type { TransactionFilter, Transaction } from '@/types/transaction.types';
import { BackButton } from '@/components/ui/back-button';
import { PrimaryRefreshControl } from '@/components/ui/refresh-control';

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
                ? 'bg-[#032252]'
                : 'border border-[#E3E7EF]'
            }`}
            onPress={() => onChange(f.key)}
          >
            <Text
              className={`text-[13px] font-semibold ${
                isActive ? 'text-[#F9B700]' : 'text-[#032252]'
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
        color="#C7CEDB"
      />
      <Text className="text-base font-semibold text-[#032252] mt-4">
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

// The escape hatch for a filtered view too short to scroll. The hook walks a
// few pages on its own first; this appears only once that budget is spent and
// the list still can't be dragged, so it's the difference between "there's more,
// tap here" and a screen that silently pretends the history ends there.
function LoadMoreFooter({
  isFiltered,
  onPress,
}: {
  isFiltered: boolean;
  onPress: () => void;
}) {
  return (
    <View className="py-6 items-center px-6">
      <TouchableOpacity
        className="px-6 py-3 rounded-full border border-[#E3E7EF]"
        onPress={onPress}
      >
        <Text className="text-[13px] font-semibold text-[#032252]">
          Load more
        </Text>
      </TouchableOpacity>
      {isFiltered && (
        <Text className="text-xs text-[#6B7280] text-center mt-3">
          Only transactions loaded so far are searched.
        </Text>
      )}
    </View>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <MaterialCommunityIcons name="wifi-off" size={64} color="#C7CEDB" />
      <Text className="text-base font-semibold text-[#032252] mt-4">
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
    handleScrollBeginDrag,
    handleRefresh,
    handleLayout,
    handleContentSizeChange,
    showLoadMore,
    handleLoadMore,
  } = useTransactions();

  const errorMessage = isError
    ? (error as any)?.response?.data?.error ||
      error?.message ||
      'Something went wrong'
    : '';

  return (
    <HeaderScreen padded={false} bottomInset={false}>
      {/* Title row. The navy DashboardHeader above supplies the dark band the
          old purple gradient used to provide, so this sits on plain white. */}
      <View className="px-6 pt-4 pb-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            {router.canGoBack() && <BackButton className="" />}
            <Text
              className="text-xl font-bold text-[#032252] leading-[24px]"
              style={{ includeFontPadding: false }}
            >
              Transaction History
            </Text>
          </View>
          {/* Sort control — hidden until it actually sorts. It had no onPress,
              so it read as a broken button. Restore when sorting is wired up.
          <MaterialCommunityIcons
            name="swap-vertical"
            size={22}
            color="#032252"
          />
          */}
        </View>
      </View>

      {/* Search Bar */}
      <View className="mx-6 mt-4 bg-[#F1F3F8] rounded-xl px-4 py-3 flex-row items-center">
        <TextInput
          className="flex-1 text-[15px] text-[#032252] p-0"
          placeholder="Search"
          placeholderTextColor="#8A93A6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <MaterialCommunityIcons name="magnify" size={20} color="#032252" />
      </View>

      {/* Filter Tabs */}
      <FilterTabs active={filter} onChange={setFilter} />

      {/* Transaction List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#032252" />
        </View>
      ) : isError && sections.length === 0 ? (
        <SectionList
          sections={[]}
          renderItem={() => null}
          ListEmptyComponent={<ErrorState message={errorMessage} />}
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <PrimaryRefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
            />
          }
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item: Transaction) => item.id}
          renderSectionHeader={({ section }) => (
            <Text className="text-xs font-semibold text-[#6B7280] px-6 pt-5 pb-2">
              {section.title}
            </Text>
          )}
          renderItem={({ item }: { item: Transaction }) => (
            <TransactionRow
              transaction={item}
              onPress={() => openTransactionDetails(item)}
            />
          )}
          ListEmptyComponent={<EmptyState isFiltered={isFiltered} />}
          // flexGrow, not flex: the empty state should still fill the screen,
          // but a "Load more" footer under it needs its own height — `flex: 1`
          // caps the content box at the viewport and squeezes the footer out,
          // which is precisely the case (nothing matched yet) where it matters.
          contentContainerStyle={
            sections.length === 0 ? { flexGrow: 1 } : { paddingBottom: 20 }
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          onScrollBeginDrag={handleScrollBeginDrag}
          onLayout={handleLayout}
          onContentSizeChange={handleContentSizeChange}
          refreshControl={
            <PrimaryRefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={handleRefresh}
            />
          }
          stickySectionHeadersEnabled={false}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#032252" />
              </View>
            ) : showLoadMore ? (
              <LoadMoreFooter isFiltered={isFiltered} onPress={handleLoadMore} />
            ) : null
          }
        />
      )}
    </HeaderScreen>
  );
}
