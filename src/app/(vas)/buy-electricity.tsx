import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardProvider, KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import { vasService } from '@/services/vas.service';
import { useVasStore } from '@/stores/vas.store';
import { useAccountSummary } from '@/hooks/use-account-summary';
import type { VasBiller } from '@/types/vas.types';
import { formatNairaWhole } from '@/utils/format';
import TransactionSummaryModal from '@/components/features/vas/TransactionSummaryModal';
import { InsufficientFundsHint } from '@/components/ui/insufficient-funds-hint';
import { colors } from '@/theme/palette';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

type MeterType = 'prepaid' | 'postpaid';

function todayFormatted(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${day}-${month}-${now.getFullYear()}`;
}

export default function BuyElectricityScreen() {
  const categoryId = useVasStore((s) => s.categoryId);
  const setBiller = useVasStore((s) => s.setBiller);
  const setProduct = useVasStore((s) => s.setProduct);
  const setStoreMeter = useVasStore((s) => s.setMeterNumber);
  const setStoreAccountType = useVasStore((s) => s.setAccountType);
  const setStoreAmount = useVasStore((s) => s.setAmount);

  const [meterType, setMeterType] = useState<MeterType>('prepaid');
  const [selectedBillerId, setSelectedBillerId] = useState<number | null>(null);
  const [meter, setMeter] = useState('');
  const [amount, setAmount] = useState('');
  const [providerModalVisible, setProviderModalVisible] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');
  const [summaryVisible, setSummaryVisible] = useState(false);

  const billersQuery = useQuery({
    queryKey: [QUERY_KEYS.VAS_BILLERS, categoryId],
    queryFn: () => vasService.getBillers(categoryId!),
    enabled: !!categoryId,
  });

  const productsQuery = useQuery({
    queryKey: [QUERY_KEYS.VAS_PRODUCTS, categoryId, selectedBillerId],
    queryFn: () => vasService.getProducts(categoryId!, selectedBillerId!),
    enabled: !!categoryId && !!selectedBillerId,
  });

  const selectedBiller =
    billersQuery.data?.find((b) => b.id === selectedBillerId) ?? null;

  // Each biller returns a PREPAID and a POSTPAID product (each with its own
  // unique_code + min/max); the toggle picks which one applies.
  const selectedProduct =
    productsQuery.data?.find(
      (p) => p.name.toUpperCase() === meterType.toUpperCase(),
    ) ?? null;
  // The provider is loaded but doesn't offer the toggled meter type.
  const typeUnavailable =
    !!selectedBillerId &&
    !productsQuery.isLoading &&
    !productsQuery.isError &&
    !selectedProduct;

  const search = providerSearch.trim().toLowerCase();
  const filteredBillers = (billersQuery.data ?? []).filter((b) =>
    b.name.toLowerCase().includes(search),
  );

  const closeProviderModal = () => {
    setProviderModalVisible(false);
    setProviderSearch('');
  };

  const selectProvider = (biller: VasBiller) => {
    setSelectedBillerId(biller.id);
    setBiller(biller);
    closeProviderModal();
  };

  const { data: accountSummary } = useAccountSummary();

  const amountNum = Number(amount) || 0;
  const withinRange =
    !!selectedProduct &&
    amountNum >= selectedProduct.min_amount &&
    amountNum <= selectedProduct.max_amount;
  const amountOutOfRange =
    !!selectedProduct && amount.length > 0 && !withinRange;
  const exceedsBalance =
    accountSummary?.available_balance != null &&
    amountNum > 0 &&
    amountNum > accountSummary.available_balance;

  // Meter-number length varies by disco (dynamic), so just require a non-empty
  // meter and let the backend validate it.
  const canProceed =
    !!selectedProduct && meter.length > 0 && withinRange && !exceedsBalance;

  const meterTypeLabel = meterType === 'prepaid' ? 'Prepaid' : 'Postpaid';

  const handleProceed = () => {
    if (!canProceed) return;
    setSummaryVisible(true);
  };

  const handleSave = () => {
    if (!selectedProduct || !selectedBiller) return;
    setProduct(selectedProduct);
    setStoreMeter(meter);
    setStoreAccountType(meterType);
    setStoreAmount(amount);
    setSummaryVisible(false);
    router.push({
      pathname: '/(vas)/vas-pin',
      params: {
        provider: selectedBiller.name,
        meter,
        meterType: meterTypeLabel,
        amount: formatNairaWhole(amountNum),
        date: todayFormatted(),
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          className="self-start border border-line rounded-[20px] px-4 py-1.5 mt-2 mb-6"
          onPress={() => router.back()}
        >
          <Text className="text-sm font-medium text-ink-body">Back</Text>
        </TouchableOpacity>

        <Text className="text-[22px] font-bold text-ink mb-6">Electricity</Text>

        {/* Prepaid / Postpaid toggle — selects which product applies */}
        <View className="bg-surface-input rounded-full p-1 flex-row mb-6">
          {(['prepaid', 'postpaid'] as MeterType[]).map((type) => {
            const isActive = meterType === type;
            return (
              <TouchableOpacity
                key={type}
                className={`flex-1 py-3 rounded-full items-center ${
                  isActive ? 'bg-white' : ''
                }`}
                activeOpacity={0.8}
                onPress={() => setMeterType(type)}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isActive ? 'text-ink' : 'text-ink-muted'
                  }`}
                >
                  {type === 'prepaid' ? 'Prepaid' : 'Postpaid'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Provider selector (dropdown — 13 discos don't fit a logo grid) */}
        <Text className="text-sm font-medium text-ink mb-2">Select Provider</Text>
        <TouchableOpacity
          className="bg-surface-input rounded-xl px-4 py-[15px] mb-6 flex-row items-center"
          activeOpacity={0.8}
          onPress={() => setProviderModalVisible(true)}
        >
          {selectedBiller && (
            <Image
              source={{ uri: selectedBiller.image }}
              className="w-6 h-6 rounded-full mr-2"
              resizeMode="contain"
            />
          )}
          <Text
            className={`flex-1 text-[15px] ${
              selectedBiller ? 'text-ink' : 'text-ink-muted'
            }`}
            numberOfLines={1}
          >
            {selectedBiller ? selectedBiller.name : 'Select Provider'}
          </Text>
          {billersQuery.isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialCommunityIcons name="chevron-down" size={22} color={colors.inkSoft} />
          )}
        </TouchableOpacity>

        {/* Meter number */}
        <Text className="text-sm font-medium text-ink mb-2">Meter Number</Text>
        <View className="bg-surface-input rounded-xl px-4 py-[15px] mb-6 flex-row items-center">
          <TextInput
            className="flex-1 text-[15px] text-ink p-0"
            value={meter}
            onChangeText={(t) => setMeter(t.replace(/\D/g, ''))}
            placeholder="Meter Number"
            placeholderTextColor={colors.inkMuted}
            keyboardType="number-pad"
          />
          <MaterialCommunityIcons name="card-outline" size={22} color={colors.inkSoft} />
        </View>

        {/* Amount */}
        <Text className="text-sm font-medium text-ink mb-2">Amount</Text>
        <View className="bg-surface-input rounded-xl px-4 py-[15px] mb-1.5">
          <TextInput
            className="text-[15px] text-ink p-0"
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
            placeholder="Amount"
            placeholderTextColor={colors.inkMuted}
            keyboardType="number-pad"
          />
        </View>
        {typeUnavailable ? (
          <Text className="text-xs text-danger mb-3">
            {meterTypeLabel} isn't available for this provider.
          </Text>
        ) : amountOutOfRange && selectedProduct ? (
          <Text className="text-xs text-danger mb-3">
            Enter an amount between {formatNairaWhole(selectedProduct.min_amount)} and{' '}
            {formatNairaWhole(selectedProduct.max_amount)}
          </Text>
        ) : (
          <InsufficientFundsHint show={exceedsBalance} />
        )}

        {/* Quick amounts */}
        <View className="flex-row flex-wrap justify-between">
          {QUICK_AMOUNTS.map((value) => {
            const isActive = amountNum === value;
            return (
              <TouchableOpacity
                key={value}
                activeOpacity={0.8}
                onPress={() => setAmount(String(value))}
                className={`w-[31%] rounded-xl py-3 items-center mb-3 border ${
                  isActive
                    ? 'bg-primary-surface border-primary'
                    : 'bg-surface-input border-surface-input'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isActive ? 'text-primary' : 'text-ink-body'
                  }`}
                >
                  {formatNairaWhole(value)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-6 pb-4">
        <TouchableOpacity
          className={`rounded-full py-4 items-center ${
            canProceed ? 'bg-primary' : 'bg-surface-disabled'
          }`}
          onPress={handleProceed}
          disabled={!canProceed}
          activeOpacity={0.85}
        >
          <Text
            className={`text-base font-semibold ${
              canProceed ? 'text-white' : 'text-ink-muted'
            }`}
          >
            Proceed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Provider picker bottom sheet */}
      <Modal
        visible={providerModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeProviderModal}
      >
        <KeyboardProvider>
          <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-white rounded-t-3xl pt-4 pb-10 max-h-[70%]">
                <View className="flex-row items-center justify-between px-6 mb-4">
                  <Text className="text-lg font-bold text-ink">
                    Select Provider
                  </Text>
                  <TouchableOpacity onPress={closeProviderModal}>
                    <MaterialCommunityIcons name="close" size={24} color={colors.inkBody} />
                  </TouchableOpacity>
                </View>

                {billersQuery.isLoading ? (
                  <View className="h-24 items-center justify-center">
                    <ActivityIndicator color={colors.primary} />
                  </View>
                ) : billersQuery.isError ? (
                  <View className="h-24 items-center justify-center px-6">
                    <Text className="text-[13px] text-danger mb-3 text-center">
                      Couldn't load providers.
                    </Text>
                    <TouchableOpacity
                      className="border-[1.5px] border-primary rounded-full px-6 py-2"
                      onPress={() => billersQuery.refetch()}
                    >
                      <Text className="text-primary text-sm font-semibold">Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : !billersQuery.data?.length ? (
                  <View className="h-24 items-center justify-center px-6">
                    <Text className="text-[13px] text-ink-soft">
                      No providers available.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View className="px-6 mb-3">
                      <View className="bg-surface-input rounded-xl px-4 py-3 flex-row items-center">
                        <MaterialCommunityIcons name="magnify" size={20} color={colors.inkMuted} />
                        <TextInput
                          className="flex-1 text-[15px] text-ink p-0 ml-2"
                          value={providerSearch}
                          onChangeText={setProviderSearch}
                          placeholder="Search providers"
                          placeholderTextColor={colors.inkMuted}
                        />
                        {providerSearch.length > 0 && (
                          <TouchableOpacity onPress={() => setProviderSearch('')}>
                            <MaterialCommunityIcons
                              name="close-circle"
                              size={18}
                              color={colors.inkMuted}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {filteredBillers.length === 0 ? (
                      <View className="h-24 items-center justify-center px-6">
                        <Text className="text-[13px] text-ink-soft text-center">
                          No providers match "{providerSearch.trim()}".
                        </Text>
                      </View>
                    ) : (
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                      >
                        {filteredBillers.map((biller) => {
                          const isSelected = biller.id === selectedBillerId;
                          return (
                            <TouchableOpacity
                              key={biller.id}
                              className={`px-6 py-4 border-b border-line-subtle flex-row items-center ${
                                isSelected ? 'bg-primary-surface' : ''
                              }`}
                              onPress={() => selectProvider(biller)}
                            >
                              <Image
                                source={{ uri: biller.image }}
                                className="w-8 h-8 rounded-full mr-3"
                                resizeMode="contain"
                              />
                              <Text
                                className="text-[15px] text-ink flex-1 mr-3"
                                numberOfLines={1}
                              >
                                {biller.name}
                              </Text>
                              {isSelected && (
                                <MaterialCommunityIcons
                                  name="check-circle"
                                  size={20}
                                  color={colors.primary}
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                  </>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </KeyboardProvider>
      </Modal>

      <TransactionSummaryModal
        visible={summaryVisible}
        onClose={() => setSummaryVisible(false)}
        onSave={handleSave}
        provider={selectedBiller?.name ?? ''}
        meter={meter}
        meterType={meterTypeLabel}
        amount={formatNairaWhole(amountNum)}
        date={todayFormatted()}
      />
    </SafeAreaView>
  );
}
