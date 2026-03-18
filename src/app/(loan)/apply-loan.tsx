import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { loanService } from '@/services/loan.service';
import { useLoanStore } from '@/stores/loan.store';
import type { LoanProduct } from '@/types/loan.types';

const PRIMARY = '#472FF8';
const REPAYMENT_OPTIONS = ['Weekly', 'Bi-Weekly', 'Monthly'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => currentYear - i);

/** Auto-format raw digits into MM/YYYY as the user types */
function formatBusinessAge(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) {
    // Clamp first digit: if user types 2-9 as first char, prepend 0
    if (digits.length === 1 && parseInt(digits, 10) > 1) return '0' + digits;
    // Clamp two-digit month to 01-12
    if (digits.length === 2) {
      const month = parseInt(digits, 10);
      if (month < 1) return '01';
      if (month > 12) return '12';
    }
    return digits;
  }
  const monthPart = digits.slice(0, 2);
  let month = parseInt(monthPart, 10);
  if (month < 1) month = 1;
  if (month > 12) month = 12;
  return String(month).padStart(2, '0') + '/' + digits.slice(2);
}

/** Check if businessAge is a complete valid MM/YYYY */
function isValidBusinessAge(value: string): boolean {
  const match = value.match(/^(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10);
  if (month < 1 || month > 12) return false;
  // Must not be in the future
  const now = new Date();
  if (year > now.getFullYear()) return false;
  if (year === now.getFullYear() && month > now.getMonth() + 1) return false;
  return true;
}

export default function ApplyLoanScreen() {
  const store = useLoanStore();

  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await loanService.getLoanProducts();
        setProducts(data);
      } catch {
        // silent fail for mock
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const loanAmountNum = parseFloat(store.loanAmount) || 0;
  const isAmountInRange = loanAmountNum >= 20000 && loanAmountNum <= 2000000;

  const canProceed =
    store.businessValue.trim() !== '' &&
    isValidBusinessAge(store.businessAge) &&
    store.businessAddress.trim() !== '' &&
    store.loanProduct.trim() !== '' &&
    store.loanAmount.trim() !== '' &&
    isAmountInRange &&
    store.repaymentFrequency.trim() !== '';

  const handleProceed = async () => {
    if (!canProceed || submitting) return;
    setSubmitting(true);
    try {
      const summary = await loanService.calculateLoan({
        businessValue: store.businessValue,
        businessAge: store.businessAge,
        businessAddress: store.businessAddress,
        loanProduct: store.loanProduct,
        loanAmount: store.loanAmount,
        repaymentFrequency: store.repaymentFrequency,
      });
      store.setSummary(summary);
      router.push('/(loan)/review-summary');
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity
        className="self-start border border-[#E5E7EB] rounded-[20px] px-4 py-1.5 mt-2 mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-medium text-[#374151]">Back</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <Text className="text-[22px] font-bold text-[#1A1A1A] mb-6">Apply for Loan</Text>

       
        <View className="mb-5">
          <Text className="text-[13px] font-semibold text-[#374151] mb-2">Business Value</Text>
          <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent flex-row items-center">
            <TextInput
              className="flex-1 text-[15px] text-[#1A1A1A] p-0"
              value={store.businessValue}
              onChangeText={(t) => store.setFormField('businessValue', t)}
              placeholder="Enter the value of your business"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Age of Business */}
        <View className="mb-5">
          <Text className="text-[13px] font-semibold text-[#374151] mb-2">Age of Business</Text>
          <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent flex-row items-center">
            <TextInput
              className="flex-1 text-[15px] text-[#1A1A1A] p-0"
              value={store.businessAge}
              onChangeText={(t) => {
                const formatted = formatBusinessAge(t);
                store.setFormField('businessAge', formatted);
              }}
              placeholder="MM/YYYY"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={7}
            />
            <TouchableOpacity
              onPress={() => {
                // Sync modal selection with current field value
                const match = store.businessAge.match(/^(\d{2})\/(\d{4})$/);
                if (match) {
                  setSelectedMonth(parseInt(match[1], 10) - 1);
                  setSelectedYear(parseInt(match[2], 10));
                }
                setShowDateModal(true);
              }}
            >
              <MaterialCommunityIcons name="calendar" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Business Address */}
        <View className="mb-5">
          <Text className="text-[13px] font-semibold text-[#374151] mb-2">Business Address</Text>
          <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent flex-row items-center">
            <TextInput
              className="flex-1 text-[15px] text-[#1A1A1A] p-0"
              value={store.businessAddress}
              onChangeText={(t) => store.setFormField('businessAddress', t)}
              placeholder="Enter business address"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Loan Product (dropdown) */}
        <View className="mb-5">
          <Text className="text-[13px] font-semibold text-[#374151] mb-2">Loan Product</Text>
          <TouchableOpacity
            className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent flex-row items-center"
            onPress={() => {
              setShowProductDropdown((v) => !v);
              setShowFrequencyDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <Text className={`flex-1 text-[15px] ${store.loanProduct ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'}`}>
              {store.loanProduct || 'Enter Loan product'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          {showProductDropdown && (
            <View className="bg-white rounded-xl border border-[#E5E7EB] mt-1 overflow-hidden">
              {loading ? (
                <ActivityIndicator color={PRIMARY} style={{ padding: 12 }} />
              ) : (
                products.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    className="px-4 py-[14px] border-b border-[#F3F4F6]"
                    onPress={() => {
                      store.setFormField('loanProduct', p.name);
                      setShowProductDropdown(false);
                    }}
                  >
                    <Text className="text-sm text-[#1A1A1A]">{p.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Loan Amount */}
        <View className="mb-5">
          <Text className="text-[13px] font-semibold text-[#374151] mb-2">Loan Amount</Text>
          <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent flex-row items-center">
            <TextInput
              className="flex-1 text-[15px] text-[#1A1A1A] p-0"
              value={store.loanAmount}
              onChangeText={(t) => {
                const cleaned = t.replace(/[^0-9.]/g, '');
                const parts = cleaned.split('.');
                const sanitized = parts.length > 2
                  ? parts[0] + '.' + parts.slice(1).join('')
                  : cleaned;
                store.setFormField('loanAmount', sanitized);
              }}
              placeholder="NGN 0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
          <Text className="text-xs text-[#472FF8] mt-1.5">
            Min - Max amount: (₦ 20,000.00 - ₦ 2,000,000.00)
          </Text>
        </View>

        {/* Repayment Frequency */}
        <View className="mb-5">
          <Text className="text-[13px] font-semibold text-[#374151] mb-2">Repayment Frequency</Text>
          <TouchableOpacity
            className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] border-[1.5px] border-transparent flex-row items-center"
            onPress={() => {
              setShowFrequencyDropdown((v) => !v);
              setShowProductDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <Text className={`flex-1 text-[15px] ${store.repaymentFrequency ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'}`}>
              {store.repaymentFrequency || 'Repayment Frequency'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          {showFrequencyDropdown && (
            <View className="bg-white rounded-xl border border-[#E5E7EB] mt-1 overflow-hidden">
              {REPAYMENT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  className="px-4 py-[14px] border-b border-[#F3F4F6]"
                  onPress={() => {
                    store.setFormField('repaymentFrequency', option);
                    setShowFrequencyDropdown(false);
                  }}
                >
                  <Text className="text-sm text-[#1A1A1A]">{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View className="h-6" />
      </ScrollView>

      <View className="pb-4">
        <TouchableOpacity
          className={`rounded-full py-4 items-center ${canProceed ? 'bg-[#472FF8]' : 'bg-[#E5E7EB]'}`}
          onPress={handleProceed}
          disabled={!canProceed || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={`text-base font-semibold ${canProceed ? 'text-white' : 'text-[#9CA3AF]'}`}>
              Proceed
            </Text>
          )}
        </TouchableOpacity>
      </View>
      {/* Month/Year Picker Modal */}
      <Modal visible={showDateModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl px-6 pt-5 pb-16">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-[#1A1A1A]">Select Date</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-4 mb-6">
              {/* Month list */}
              <View className="flex-1 h-[200px] border border-[#E5E7EB] rounded-xl overflow-hidden">
                <FlatList
                  data={MONTHS}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      className={`px-4 py-3 ${selectedMonth === index ? 'bg-[#EEF0FF]' : ''}`}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text
                        className={`text-sm ${selectedMonth === index ? 'font-semibold text-[#472FF8]' : 'text-[#374151]'}`}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>

              {/* Year list */}
              <View className="flex-1 h-[200px] border border-[#E5E7EB] rounded-xl overflow-hidden">
                <FlatList
                  data={YEARS}
                  keyExtractor={(item) => item.toString()}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className={`px-4 py-3 ${selectedYear === item ? 'bg-[#EEF0FF]' : ''}`}
                      onPress={() => setSelectedYear(item)}
                    >
                      <Text
                        className={`text-sm ${selectedYear === item ? 'font-semibold text-[#472FF8]' : 'text-[#374151]'}`}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>

            <TouchableOpacity
              className="bg-[#472FF8] rounded-full py-4 items-center"
              onPress={() => {
                const mm = String(selectedMonth + 1).padStart(2, '0');
                store.setFormField('businessAge', `${mm}/${selectedYear}`);
                setShowDateModal(false);
              }}
              activeOpacity={0.85}
            >
              <Text className="text-base font-semibold text-white">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
