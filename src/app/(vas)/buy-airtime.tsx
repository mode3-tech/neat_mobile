import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import { vasService } from '@/services/vas.service';
import { useVasStore } from '@/stores/vas.store';
import { useAccountSummary } from '@/hooks/use-account-summary';
import type { VasBiller } from '@/types/vas.types';
import TransactionSummaryModal from '@/components/features/vas/TransactionSummaryModal';
import { InsufficientFundsHint } from '@/components/ui/insufficient-funds-hint';

const PHONE_LENGTH = 11;
const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

function formatNaira(amount: number): string {
  return '₦' + new Intl.NumberFormat('en-NG').format(amount);
}

function formatAmount(amount: number): string {
  return (
    '₦' +
    new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  );
}

function todayFormatted(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${day}-${month}-${now.getFullYear()}`;
}

export default function BuyAirtimeScreen() {
  const categoryId = useVasStore((s) => s.categoryId);
  const setBiller = useVasStore((s) => s.setBiller);
  const setProduct = useVasStore((s) => s.setProduct);
  const setStorePhone = useVasStore((s) => s.setPhoneNumber);
  const setStoreAmount = useVasStore((s) => s.setAmount);

  const [selectedBillerId, setSelectedBillerId] = useState<number | null>(null);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
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

  const product = productsQuery.data?.[0] ?? null;

  // Keep the store's product in sync with whichever provider is selected.
  useEffect(() => {
    if (product) setProduct(product);
  }, [product, setProduct]);

  const selectProvider = (biller: VasBiller) => {
    setSelectedBillerId(biller.id);
    setBiller(biller);
  };

  const selectedBiller =
    billersQuery.data?.find((b) => b.id === selectedBillerId) ?? null;

  const { data: accountSummary } = useAccountSummary();

  const amountNum = Number(amount) || 0;
  const withinRange =
    !!product &&
    amountNum >= product.min_amount &&
    amountNum <= product.max_amount;
  const amountOutOfRange = !!product && amount.length > 0 && !withinRange;
  const exceedsBalance =
    accountSummary?.available_balance != null &&
    amountNum > 0 &&
    amountNum > accountSummary.available_balance;

  const canProceed =
    !!product &&
    phone.length === PHONE_LENGTH &&
    withinRange &&
    !exceedsBalance;

  const handleProceed = () => {
    if (!canProceed) return;
    setSummaryVisible(true);
  };

  const handleSave = () => {
    if (!product || !selectedBiller) return;
    setStorePhone(phone);
    setStoreAmount(amount);
    setSummaryVisible(false);
    router.push({
      pathname: '/(vas)/vas-pin',
      params: {
        provider: selectedBiller.name,
        phone,
        amount: formatAmount(amountNum),
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
          className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
          onPress={() => router.back()}
        >
          <Text className="text-sm font-medium text-[#374151]">Back</Text>
        </TouchableOpacity>

        <Text className="text-[22px] font-bold text-[#1A1A1A] mb-6">Buy Airtime</Text>

        {/* Provider selector */}
        <View className="bg-[#F9FAFB] rounded-2xl p-4 mb-6">
          <Text className="text-sm font-medium text-[#1A1A1A] mb-3">
            Select Service Provider
          </Text>

          {billersQuery.isLoading ? (
            <View className="h-[68px] items-center justify-center">
              <ActivityIndicator color="#472FF8" />
            </View>
          ) : billersQuery.isError ? (
            <View className="h-[68px] items-center justify-center">
              <Text className="text-[13px] text-[#EF4444]">
                Couldn't load providers. Pull back and try again.
              </Text>
            </View>
          ) : (
            <View className="flex-row justify-between">
              {billersQuery.data?.map((biller) => {
                const isSelected = biller.id === selectedBillerId;
                return (
                  <TouchableOpacity
                    key={biller.id}
                    activeOpacity={0.8}
                    onPress={() => selectProvider(biller)}
                    className={`w-[68px] h-[68px] rounded-2xl bg-white items-center justify-center border-2 ${
                      isSelected ? 'border-[#472FF8]' : 'border-transparent'
                    }`}
                  >
                    <Image
                      source={{ uri: biller.image }}
                      className="w-11 h-11 rounded-full"
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Phone number */}
        <Text className="text-sm font-medium text-[#1A1A1A] mb-2">Phone Number</Text>
        <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] mb-6 flex-row items-center">
          <TextInput
            className="flex-1 text-[15px] text-[#1A1A1A] p-0"
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, PHONE_LENGTH))}
            placeholder="Phone Number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            maxLength={PHONE_LENGTH}
          />
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={22}
            color="#6B7280"
          />
        </View>

        {/* Amount */}
        <Text className="text-sm font-medium text-[#1A1A1A] mb-2">Amount</Text>
        <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] mb-1.5">
          <TextInput
            className="text-[15px] text-[#1A1A1A] p-0"
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
            placeholder="Amount"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
          />
        </View>
        {amountOutOfRange && product ? (
          <Text className="text-xs text-[#EF4444] mb-3">
            Enter an amount between {formatNaira(product.min_amount)} and{' '}
            {formatNaira(product.max_amount)}
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
                    ? 'bg-[#EEF0FF] border-[#472FF8]'
                    : 'bg-[#F5F5F5] border-[#F5F5F5]'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isActive ? 'text-[#472FF8]' : 'text-[#374151]'
                  }`}
                >
                  {formatNaira(value)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-6 pb-4">
        <TouchableOpacity
          className={`rounded-full py-4 items-center ${
            canProceed ? 'bg-[#472FF8]' : 'bg-[#E5E7EB]'
          }`}
          onPress={handleProceed}
          disabled={!canProceed}
          activeOpacity={0.85}
        >
          {productsQuery.isLoading && !!selectedBillerId ? (
            <ActivityIndicator color="#9CA3AF" />
          ) : (
            <Text
              className={`text-base font-semibold ${
                canProceed ? 'text-white' : 'text-[#9CA3AF]'
              }`}
            >
              Proceed
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <TransactionSummaryModal
        visible={summaryVisible}
        onClose={() => setSummaryVisible(false)}
        onSave={handleSave}
        provider={selectedBiller?.name ?? ''}
        phone={phone}
        amount={formatAmount(amountNum)}
        date={todayFormatted()}
      />
    </SafeAreaView>
  );
}
