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
import { HeaderScreen } from '@/components/ui/header-screen';
import { KeyboardProvider, KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import { vasService } from '@/services/vas.service';
import { useVasStore } from '@/stores/vas.store';
import { useAccountSummary } from '@/hooks/use-account-summary';
import { useVasCashback } from '@/hooks/use-vas-cashback';
import type { VasBiller, VasProduct } from '@/types/vas.types';
import { formatNairaWhole, formatNairaWholeShort } from '@/utils/format';
import TransactionSummaryModal from '@/components/features/vas/TransactionSummaryModal';
import { InsufficientFundsHint } from '@/components/ui/insufficient-funds-hint';
import { BackButton } from '@/components/ui/back-button';

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
  const setStoreUseCashback = useVasStore((s) => s.setUseCashback);

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
  // Capped against the full package × months total, matching the Amount row
  // and the payload — so changing the month count recomputes the cap too.
  const cashback = useVasCashback(totalAmount);

  // Measured against the payable with cashback fully applied, so a balance that
  // only covers the discounted price still opens the summary sheet; the sheet
  // re-checks against whatever the toggle actually leaves payable.
  const exceedsBalance =
    accountSummary?.available_balance != null &&
    totalAmount > 0 &&
    totalAmount - cashback.applied > accountSummary.available_balance;

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
    setStoreUseCashback(cashback.useCashback);
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
    <HeaderScreen padded={false}>
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-2 mt-4 mb-6">
          <BackButton className="" />
          <Text
            className="text-[22px] font-bold text-[#1A1A1A] leading-[26px]"
            style={{ includeFontPadding: false }}
          >
            Cable Subscription
          </Text>
        </View>

        {/* Provider selector */}
        <View className="bg-[#F9FAFB] rounded-2xl p-4 mb-6">
          <Text className="text-sm font-medium text-[#1A1A1A] mb-3">
            Pick Service Provider
          </Text>

          {billersQuery.isLoading ? (
            <View className="h-[68px] items-center justify-center">
              <ActivityIndicator color="#032252" />
            </View>
          ) : billersQuery.isError ? (
            <View className="h-[68px] items-center justify-center">
              <Text className="text-[13px] text-[#EF4444]">
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
                      isSelected ? 'border-[#032252]' : 'border-[#EFEFEF]'
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
        <Text className="text-sm font-medium text-[#1A1A1A] mb-2">
          Smartcard Number
        </Text>
        <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] mb-6 flex-row items-center">
          <TextInput
            className="flex-1 text-[15px] text-[#1A1A1A] p-0"
            value={smartcard}
            onChangeText={(t) => setSmartcard(t.replace(/\D/g, ''))}
            placeholder="Smartcard Number"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
          />
          <MaterialCommunityIcons name="card-outline" size={22} color="#6B7280" />
        </View>

        {/* Package selector */}
        <Text className="text-sm font-medium text-[#1A1A1A] mb-2">Select Package</Text>
        <TouchableOpacity
          className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] mb-6 flex-row items-center"
          activeOpacity={0.8}
          disabled={!selectedBillerId}
          onPress={() => setPackageModalVisible(true)}
        >
          <Text
            className={`flex-1 text-[15px] ${
              selectedPackage ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'
            }`}
            numberOfLines={1}
          >
            {selectedPackage ? selectedPackage.name : 'Select Package'}
          </Text>
          {packagesQuery.isLoading && !!selectedBillerId ? (
            <ActivityIndicator size="small" color="#032252" />
          ) : (
            <MaterialCommunityIcons name="chevron-down" size={22} color="#6B7280" />
          )}
        </TouchableOpacity>

        {/* Number of months */}
        <Text className="text-sm font-medium text-[#1A1A1A] mb-2">Number of Months</Text>
        <View className="bg-[#F5F5F5] rounded-xl px-2 py-2 mb-6 flex-row items-center justify-between">
          <TouchableOpacity
            className={`w-10 h-10 rounded-lg items-center justify-center ${
              months <= MONTH_MIN ? 'bg-[#E5E7EB]' : 'bg-white'
            }`}
            activeOpacity={0.7}
            disabled={months <= MONTH_MIN}
            onPress={() => setMonths((m) => Math.max(MONTH_MIN, m - 1))}
          >
            <MaterialCommunityIcons
              name="minus"
              size={20}
              color={months <= MONTH_MIN ? '#9CA3AF' : '#032252'}
            />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-[#1A1A1A]">
            {months} {months === 1 ? 'Month' : 'Months'}
          </Text>
          <TouchableOpacity
            className={`w-10 h-10 rounded-lg items-center justify-center ${
              months >= MONTH_MAX ? 'bg-[#E5E7EB]' : 'bg-white'
            }`}
            activeOpacity={0.7}
            disabled={months >= MONTH_MAX}
            onPress={() => setMonths((m) => Math.min(MONTH_MAX, m + 1))}
          >
            <MaterialCommunityIcons
              name="plus"
              size={20}
              color={months >= MONTH_MAX ? '#9CA3AF' : '#032252'}
            />
          </TouchableOpacity>
        </View>

        {/* Amount (read-only, derived from package × months) */}
        <Text className="text-sm font-medium text-[#1A1A1A] mb-2">Amount</Text>
        <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] mb-1.5">
          <Text
            className={`text-[15px] ${
              selectedPackage ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'
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
            canProceed ? 'bg-[#F9B700]' : 'bg-[#E5E7EB]'
          }`}
          onPress={handleProceed}
          disabled={!canProceed}
          activeOpacity={0.85}
        >
          <Text
            className={`text-base font-semibold ${
              canProceed ? 'text-[#032252]' : 'text-[#9CA3AF]'
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
              <Text className="text-lg font-bold text-[#1A1A1A]">Select Package</Text>
              <TouchableOpacity onPress={closePackageModal}>
                <MaterialCommunityIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {packagesQuery.isLoading ? (
              <View className="h-24 items-center justify-center">
                <ActivityIndicator color="#032252" />
              </View>
            ) : packagesQuery.isError ? (
              <View className="h-24 items-center justify-center px-6">
                <Text className="text-[13px] text-[#EF4444] mb-3 text-center">
                  Couldn't load packages.
                </Text>
                <TouchableOpacity
                  className="border-[1.5px] border-[#032252] rounded-full px-6 py-2"
                  onPress={() => packagesQuery.refetch()}
                >
                  <Text className="text-[#032252] text-sm font-semibold">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : !packagesQuery.data?.length ? (
              <View className="h-24 items-center justify-center px-6">
                <Text className="text-[13px] text-[#6B7280]">
                  No packages available for this provider.
                </Text>
              </View>
            ) : (
              <>
                <View className="px-6 mb-3">
                  <View className="bg-[#F5F5F5] rounded-xl px-4 py-3 flex-row items-center">
                    <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
                    <TextInput
                      className="flex-1 text-[15px] text-[#1A1A1A] p-0 ml-2"
                      value={packageSearch}
                      onChangeText={setPackageSearch}
                      placeholder="Search packages"
                      placeholderTextColor="#9CA3AF"
                    />
                    {packageSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setPackageSearch('')}>
                        <MaterialCommunityIcons
                          name="close-circle"
                          size={18}
                          color="#9CA3AF"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {filteredPackages.length === 0 ? (
                  <View className="h-24 items-center justify-center px-6">
                    <Text className="text-[13px] text-[#6B7280] text-center">
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
                          className={`px-6 py-3.5 border-b border-[#F3F4F6] flex-row items-center ${
                            isSelected ? 'bg-[#E8EEF7]' : ''
                          }`}
                          onPress={() => {
                            setSelectedPackage(pkg);
                            closePackageModal();
                          }}
                        >
                          {/* Two lines, not one — a single truncated line hides
                              the tier the package actually belongs to. */}
                          <Text
                            className="text-[15px] leading-5 text-[#1A1A1A] flex-1 mr-5"
                            numberOfLines={2}
                          >
                            {pkg.name}
                          </Text>
                          {/* Fixed-width column, left-aligned: sizing to content
                              lets flex push each figure against the right edge,
                              so "₦2,700" and "₦44,500" start at different x. A
                              fixed box puts the ₦ and the first digit of every
                              row on the same vertical line. The "/month" label
                              matters because the Amount field below shows the
                              total (package × months), not this figure. */}
                          <View className="w-[72px] shrink-0">
                            <Text
                              className="text-[15px] font-semibold text-[#1A1A1A]"
                              numberOfLines={1}
                            >
                              {formatNairaWholeShort(pkg.amount)}
                            </Text>
                            <Text className="text-[11px] text-[#6B7280]">/month</Text>
                          </View>
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
        // The Amount row keeps showing the full price — cashback is a discount
        // on what's payable, not a change to what's being bought.
        amount={selectedPackage ? formatNairaWhole(totalAmount) : ''}
        date={todayFormatted()}
        payableLabel={formatNairaWhole(cashback.payable)}
        strikeLabel={
          cashback.useCashback ? formatNairaWhole(totalAmount) : undefined
        }
        insufficient={cashback.payableExceedsBalance}
        cashbackLabel={
          cashback.available ? formatNairaWhole(cashback.applied) : undefined
        }
        cashbackOn={cashback.useCashback}
        onToggleCashback={cashback.available ? cashback.setUseCashback : undefined}
      />
    </HeaderScreen>
  );
}
