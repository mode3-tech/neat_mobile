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
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import { vasService } from '@/services/vas.service';
import { useVasStore } from '@/stores/vas.store';
import { useAccountSummary } from '@/hooks/use-account-summary';
import type { VasBiller, VasProduct } from '@/types/vas.types';
import { formatNairaWhole } from '@/utils/format';
import TransactionSummaryModal from '@/components/features/vas/TransactionSummaryModal';
import { InsufficientFundsHint } from '@/components/ui/insufficient-funds-hint';
import { Icon } from '@/theme/icons';
import { colors } from '@/theme/palette';

// Smartcard / IUC numbers vary by provider (DSTV 10–11, GOTV 10, StarTimes 11),
// so gate on a minimum length rather than a fixed one.
const MIN_SMARTCARD_LENGTH = 10;
const MONTH_MIN = 1;
const MONTH_MAX = 12;

function todayFormatted(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${day}-${month}-${now.getFullYear()}`;
}

export default function CableTvScreen() {
  const categoryId = useVasStore((s) => s.categoryId);
  const setBiller = useVasStore((s) => s.setBiller);
  const setProduct = useVasStore((s) => s.setProduct);
  const setStoreSmartcard = useVasStore((s) => s.setSmartcardNumber);
  const setStoreMonths = useVasStore((s) => s.setNoOfMonth);
  const setStoreAmount = useVasStore((s) => s.setAmount);

  const [selectedBillerId, setSelectedBillerId] = useState<number | null>(null);
  const [smartcard, setSmartcard] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<VasProduct | null>(null);
  const [months, setMonths] = useState(MONTH_MIN);
  const [packageModalVisible, setPackageModalVisible] = useState(false);
  const [packageSearch, setPackageSearch] = useState('');
  const [summaryVisible, setSummaryVisible] = useState(false);

  const billersQuery = useQuery({
    queryKey: [QUERY_KEYS.VAS_BILLERS, categoryId],
    queryFn: () => vasService.getBillers(categoryId!),
    enabled: !!categoryId,
  });

  const packagesQuery = useQuery({
    queryKey: [QUERY_KEYS.VAS_PRODUCTS, categoryId, selectedBillerId, 'all'],
    queryFn: () => vasService.getAllProducts(categoryId!, selectedBillerId!),
    enabled: !!categoryId && !!selectedBillerId,
  });

  const selectProvider = (biller: VasBiller) => {
    if (biller.id === selectedBillerId) return;
    setSelectedBillerId(biller.id);
    setBiller(biller);
    setSelectedPackage(null);
    setMonths(MONTH_MIN);
  };

  const selectedBiller =
    billersQuery.data?.find((b) => b.id === selectedBillerId) ?? null;

  const search = packageSearch.trim().toLowerCase();
  const filteredPackages = (packagesQuery.data ?? []).filter((p) =>
    p.name.toLowerCase().includes(search),
  );

  const closePackageModal = () => {
    setPackageModalVisible(false);
    setPackageSearch('');
  };

  const { data: accountSummary } = useAccountSummary();

  const totalAmount = selectedPackage ? selectedPackage.amount * months : 0;
  const exceedsBalance =
    accountSummary?.available_balance != null &&
    totalAmount > 0 &&
    totalAmount > accountSummary.available_balance;

  const canProceed =
    !!selectedBiller &&
    smartcard.length >= MIN_SMARTCARD_LENGTH &&
    !!selectedPackage &&
    !exceedsBalance;

  const handleProceed = () => {
    if (!canProceed) return;
    setSummaryVisible(true);
  };

  const handleSave = () => {
    if (!selectedPackage || !selectedBiller) return;
    setProduct(selectedPackage);
    setStoreSmartcard(smartcard);
    setStoreMonths(months);
    setStoreAmount(String(totalAmount));
    setSummaryVisible(false);
    router.push({
      pathname: '/(vas)/vas-pin',
      params: {
        provider: selectedBiller.name,
        smartcard,
        packageName: selectedPackage.name,
        months: String(months),
        amount: formatNairaWhole(totalAmount),
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

        <Text className="text-[22px] font-bold text-ink mb-6">
          Cable Subscription
        </Text>

        {/* Provider selector */}
        <View className="bg-surface-muted rounded-2xl p-4 mb-6">
          <Text className="text-sm font-medium text-ink mb-3">
            Pick Service Provider
          </Text>

          {billersQuery.isLoading ? (
            <View className="h-[68px] items-center justify-center">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : billersQuery.isError ? (
            <View className="h-[68px] items-center justify-center">
              <Text className="text-[13px] text-danger">
                Couldn't load providers. Pull back and try again.
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {billersQuery.data?.map((biller) => {
                const isSelected = biller.id === selectedBillerId;
                return (
                  <TouchableOpacity
                    key={biller.id}
                    activeOpacity={0.8}
                    onPress={() => selectProvider(biller)}
                    className={`w-[23%] aspect-square rounded-2xl bg-white overflow-hidden items-center justify-center border-2 p-2 ${
                      isSelected ? 'border-primary' : 'border-legacy-surface-3'
                    }`}
                  >
                    {/* Cable biller logos are wide, full-bleed branded JPEGs (not
                        square transparent logos), so fill the tile and `contain`
                        to show the whole logo without cropping or letterboxing it
                        to a tiny strip. */}
                    <Image
                      source={{ uri: biller.image }}
                      className="w-full h-full"
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                );
              })}
              {/* Invisible fillers keep a non-full last row left-aligned. Items
                  are w-[23%], so exactly 4 fit per row regardless of screen width. */}
              {Array.from({
                length: (4 - ((billersQuery.data?.length ?? 0) % 4)) % 4,
              }).map((_, i) => (
                <View key={`filler-${i}`} className="w-[23%]" />
              ))}
            </View>
          )}
        </View>

        {/* Smartcard number */}
        <Text className="text-sm font-medium text-ink mb-2">
          Smartcard Number
        </Text>
        <View className="bg-surface-input rounded-xl px-4 py-[15px] mb-6 flex-row items-center">
          <TextInput
            className="flex-1 text-[15px] text-ink p-0"
            value={smartcard}
            onChangeText={(t) => setSmartcard(t.replace(/\D/g, ''))}
            placeholder="Smartcard Number"
            placeholderTextColor={colors.inkMuted}
            keyboardType="number-pad"
          />
          <Icon name="meterCard" size={22} color={colors.inkSoft} />
        </View>

        {/* Package selector */}
        <Text className="text-sm font-medium text-ink mb-2">Select Package</Text>
        <TouchableOpacity
          className="bg-surface-input rounded-xl px-4 py-[15px] mb-6 flex-row items-center"
          activeOpacity={0.8}
          disabled={!selectedBillerId}
          onPress={() => setPackageModalVisible(true)}
        >
          <Text
            className={`flex-1 text-[15px] ${
              selectedPackage ? 'text-ink' : 'text-ink-muted'
            }`}
            numberOfLines={1}
          >
            {selectedPackage ? selectedPackage.name : 'Select Package'}
          </Text>
          {packagesQuery.isLoading && !!selectedBillerId ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name="chevronDown" size={22} color={colors.inkSoft} />
          )}
        </TouchableOpacity>

        {/* Number of months */}
        <Text className="text-sm font-medium text-ink mb-2">Number of Months</Text>
        <View className="bg-surface-input rounded-xl px-2 py-2 mb-6 flex-row items-center justify-between">
          <TouchableOpacity
            className={`w-10 h-10 rounded-lg items-center justify-center ${
              months <= MONTH_MIN ? 'bg-surface-disabled' : 'bg-white'
            }`}
            activeOpacity={0.7}
            disabled={months <= MONTH_MIN}
            onPress={() => setMonths((m) => Math.max(MONTH_MIN, m - 1))}
          >
            <Icon
              name="minus"
              size={20}
              color={months <= MONTH_MIN ? colors.inkMuted : colors.primary}
            />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-ink">
            {months} {months === 1 ? 'Month' : 'Months'}
          </Text>
          <TouchableOpacity
            className={`w-10 h-10 rounded-lg items-center justify-center ${
              months >= MONTH_MAX ? 'bg-surface-disabled' : 'bg-white'
            }`}
            activeOpacity={0.7}
            disabled={months >= MONTH_MAX}
            onPress={() => setMonths((m) => Math.min(MONTH_MAX, m + 1))}
          >
            <Icon
              name="plus"
              size={20}
              color={months >= MONTH_MAX ? colors.inkMuted : colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Amount (read-only, derived from package × months) */}
        <Text className="text-sm font-medium text-ink mb-2">Amount</Text>
        <View className="bg-surface-input rounded-xl px-4 py-[15px] mb-1.5">
          <Text
            className={`text-[15px] ${
              selectedPackage ? 'text-ink' : 'text-ink-muted'
            }`}
          >
            {selectedPackage ? formatNairaWhole(totalAmount) : 'Amount'}
          </Text>
        </View>
        <InsufficientFundsHint show={exceedsBalance} spacing="mb-5" />
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

      {/* Package picker bottom sheet */}
      <Modal
        visible={packageModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closePackageModal}
      >
        <KeyboardProvider>
          <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-white rounded-t-3xl pt-4 pb-10 max-h-[70%]">
            <View className="flex-row items-center justify-between px-6 mb-4">
              <Text className="text-lg font-bold text-ink">Select Package</Text>
              <TouchableOpacity onPress={closePackageModal}>
                <Icon name="close" size={24} color={colors.inkBody} />
              </TouchableOpacity>
            </View>

            {packagesQuery.isLoading ? (
              <View className="h-24 items-center justify-center">
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : packagesQuery.isError ? (
              <View className="h-24 items-center justify-center px-6">
                <Text className="text-[13px] text-danger mb-3 text-center">
                  Couldn't load packages.
                </Text>
                <TouchableOpacity
                  className="border-[1.5px] border-primary rounded-full px-6 py-2"
                  onPress={() => packagesQuery.refetch()}
                >
                  <Text className="text-primary text-sm font-semibold">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : !packagesQuery.data?.length ? (
              <View className="h-24 items-center justify-center px-6">
                <Text className="text-[13px] text-ink-soft">
                  No packages available for this provider.
                </Text>
              </View>
            ) : (
              <>
                <View className="px-6 mb-3">
                  <View className="bg-surface-input rounded-xl px-4 py-3 flex-row items-center">
                    <Icon name="search" size={20} color={colors.inkMuted} />
                    <TextInput
                      className="flex-1 text-[15px] text-ink p-0 ml-2"
                      value={packageSearch}
                      onChangeText={setPackageSearch}
                      placeholder="Search packages"
                      placeholderTextColor={colors.inkMuted}
                    />
                    {packageSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setPackageSearch('')}>
                        <Icon
                          name="clear"
                          size={18}
                          color={colors.inkMuted}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {filteredPackages.length === 0 ? (
                  <View className="h-24 items-center justify-center px-6">
                    <Text className="text-[13px] text-ink-soft text-center">
                      No packages match "{packageSearch.trim()}".
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {filteredPackages.map((pkg) => {
                      const isSelected =
                        selectedPackage?.unique_code === pkg.unique_code;
                      return (
                        <TouchableOpacity
                          key={pkg.unique_code}
                          className={`px-6 py-4 border-b border-line-subtle flex-row items-center ${
                            isSelected ? 'bg-primary-surface' : ''
                          }`}
                          onPress={() => {
                            setSelectedPackage(pkg);
                            closePackageModal();
                          }}
                        >
                          <Text
                            className="text-[15px] text-ink flex-1 mr-3"
                            numberOfLines={1}
                          >
                            {pkg.name}
                          </Text>
                          {isSelected && (
                            <Icon
                              name="checkCircle"
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
        smartcard={smartcard}
        packageName={selectedPackage?.name ?? ''}
        months={String(months)}
        amount={selectedPackage ? formatNairaWhole(totalAmount) : ''}
        date={todayFormatted()}
      />
    </SafeAreaView>
  );
}
