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
import type { VasBiller, VasProduct } from '@/types/vas.types';
import { formatNairaWhole } from '@/utils/format';
import TransactionSummaryModal from '@/components/features/vas/TransactionSummaryModal';
import { InsufficientFundsHint } from '@/components/ui/insufficient-funds-hint';

const PHONE_LENGTH = 11;

function todayFormatted(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${day}-${month}-${now.getFullYear()}`;
}

export default function BuyDataScreen() {
  const categoryId = useVasStore((s) => s.categoryId);
  const setBiller = useVasStore((s) => s.setBiller);
  const setProduct = useVasStore((s) => s.setProduct);
  const setStorePhone = useVasStore((s) => s.setPhoneNumber);
  const setStoreAmount = useVasStore((s) => s.setAmount);

  const [selectedBillerId, setSelectedBillerId] = useState<number | null>(null);
  const [phone, setPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<VasProduct | null>(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [planSearch, setPlanSearch] = useState('');
  const [summaryVisible, setSummaryVisible] = useState(false);

  const billersQuery = useQuery({
    queryKey: [QUERY_KEYS.VAS_BILLERS, categoryId],
    queryFn: () => vasService.getBillers(categoryId!),
    enabled: !!categoryId,
  });

  const plansQuery = useQuery({
    queryKey: [QUERY_KEYS.VAS_PRODUCTS, categoryId, selectedBillerId, 'all'],
    queryFn: () => vasService.getAllProducts(categoryId!, selectedBillerId!),
    enabled: !!categoryId && !!selectedBillerId,
  });

  const selectProvider = (biller: VasBiller) => {
    if (biller.id === selectedBillerId) return;
    setSelectedBillerId(biller.id);
    setBiller(biller);
    setSelectedPlan(null);
  };

  const selectedBiller =
    billersQuery.data?.find((b) => b.id === selectedBillerId) ?? null;

  const planQuery = planSearch.trim().toLowerCase();
  const filteredPlans = (plansQuery.data ?? []).filter((p) =>
    p.name.toLowerCase().includes(planQuery),
  );

  const closePlanModal = () => {
    setPlanModalVisible(false);
    setPlanSearch('');
  };

  const { data: accountSummary } = useAccountSummary();

  const exceedsBalance =
    !!selectedPlan &&
    accountSummary?.available_balance != null &&
    selectedPlan.amount > accountSummary.available_balance;

  const canProceed =
    !!selectedBiller &&
    phone.length === PHONE_LENGTH &&
    !!selectedPlan &&
    !exceedsBalance;

  const handleProceed = () => {
    if (!canProceed) return;
    setSummaryVisible(true);
  };

  const handleSave = () => {
    if (!selectedPlan || !selectedBiller) return;
    setProduct(selectedPlan);
    setStorePhone(phone);
    setStoreAmount(String(selectedPlan.amount));
    setSummaryVisible(false);
    router.push({
      pathname: '/(vas)/vas-pin',
      params: {
        provider: selectedBiller.name,
        phone,
        plan: selectedPlan.name,
        amount: formatNairaWhole(selectedPlan.amount),
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

        <Text className="text-[22px] font-bold text-[#1A1A1A] mb-6">Data Bundles</Text>

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
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {billersQuery.data?.map((biller) => {
                const isSelected = biller.id === selectedBillerId;
                return (
                  <TouchableOpacity
                    key={biller.id}
                    activeOpacity={0.8}
                    onPress={() => selectProvider(biller)}
                    className={`w-[23%] aspect-square rounded-2xl bg-white items-center justify-center border-2 ${
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

        {/* Data plan selector */}
        <Text className="text-sm font-medium text-[#1A1A1A] mb-2">Data Plan</Text>
        <TouchableOpacity
          className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] mb-1.5 flex-row items-center"
          activeOpacity={0.8}
          disabled={!selectedBillerId}
          onPress={() => setPlanModalVisible(true)}
        >
          <Text
            className={`flex-1 text-[15px] ${
              selectedPlan ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'
            }`}
            numberOfLines={1}
          >
            {selectedPlan ? selectedPlan.name : 'Select Plan'}
          </Text>
          {plansQuery.isLoading && !!selectedBillerId ? (
            <ActivityIndicator size="small" color="#472FF8" />
          ) : (
            <MaterialCommunityIcons name="chevron-down" size={22} color="#6B7280" />
          )}
        </TouchableOpacity>
        <InsufficientFundsHint show={exceedsBalance} spacing="mb-5" />
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
          <Text
            className={`text-base font-semibold ${
              canProceed ? 'text-white' : 'text-[#9CA3AF]'
            }`}
          >
            Proceed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Plan picker bottom sheet */}
      <Modal
        visible={planModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closePlanModal}
      >
        <KeyboardProvider>
          <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-white rounded-t-3xl pt-4 pb-10 max-h-[70%]">
            <View className="flex-row items-center justify-between px-6 mb-4">
              <Text className="text-lg font-bold text-[#1A1A1A]">Select Plan</Text>
              <TouchableOpacity onPress={closePlanModal}>
                <MaterialCommunityIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {plansQuery.isLoading ? (
              <View className="h-24 items-center justify-center">
                <ActivityIndicator color="#472FF8" />
              </View>
            ) : plansQuery.isError ? (
              <View className="h-24 items-center justify-center px-6">
                <Text className="text-[13px] text-[#EF4444] mb-3 text-center">
                  Couldn't load data plans.
                </Text>
                <TouchableOpacity
                  className="border-[1.5px] border-[#472FF8] rounded-full px-6 py-2"
                  onPress={() => plansQuery.refetch()}
                >
                  <Text className="text-[#472FF8] text-sm font-semibold">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : !plansQuery.data?.length ? (
              <View className="h-24 items-center justify-center px-6">
                <Text className="text-[13px] text-[#6B7280]">
                  No data plans available for this provider.
                </Text>
              </View>
            ) : (
              <>
                <View className="px-6 mb-3">
                  <View className="bg-[#F5F5F5] rounded-xl px-4 py-3 flex-row items-center">
                    <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
                    <TextInput
                      className="flex-1 text-[15px] text-[#1A1A1A] p-0 ml-2"
                      value={planSearch}
                      onChangeText={setPlanSearch}
                      placeholder="Search plans"
                      placeholderTextColor="#9CA3AF"
                    />
                    {planSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setPlanSearch('')}>
                        <MaterialCommunityIcons
                          name="close-circle"
                          size={18}
                          color="#9CA3AF"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {filteredPlans.length === 0 ? (
                  <View className="h-24 items-center justify-center px-6">
                    <Text className="text-[13px] text-[#6B7280] text-center">
                      No plans match "{planSearch.trim()}".
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {filteredPlans.map((plan) => {
                      const isSelected =
                        selectedPlan?.unique_code === plan.unique_code;
                      return (
                        <TouchableOpacity
                          key={plan.unique_code}
                          className={`px-6 py-4 border-b border-[#F3F4F6] flex-row items-center ${
                            isSelected ? 'bg-[#EEF0FF]' : ''
                          }`}
                          onPress={() => {
                            setSelectedPlan(plan);
                            closePlanModal();
                          }}
                        >
                          <Text
                            className="text-[15px] text-[#1A1A1A] flex-1 mr-3"
                            numberOfLines={1}
                          >
                            {plan.name}
                          </Text>
                          {isSelected && (
                            <MaterialCommunityIcons
                              name="check-circle"
                              size={20}
                              color="#472FF8"
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
        phone={phone}
        plan={selectedPlan?.name ?? ''}
        amount={selectedPlan ? formatNairaWhole(selectedPlan.amount) : ''}
        date={todayFormatted()}
      />
    </SafeAreaView>
  );
}
