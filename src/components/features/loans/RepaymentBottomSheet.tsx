import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

import { loanService } from '@/services/loan.service';
import { PIN_LENGTH, QUERY_KEYS } from '@/constants';

interface RepaymentBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  loan: { loan_id: string } | undefined;
  availableBalance: number;
}

function formatCurrency(amount: number): string {
  return '₦' + new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function RepaymentBottomSheet({
  visible,
  onClose,
  loan,
  availableBalance,
}: RepaymentBottomSheetProps) {
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  // Reset form whenever the sheet opens
  useEffect(() => {
    if (visible) {
      setAmount('');
      setPin('');
      setShowPin(false);
    }
  }, [visible]);

  const { mutate: submitRepayment, isPending } = useMutation({
    mutationFn: loanService.submitRepayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOANS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY] });
      onClose();
      setSuccessVisible(true);
    },
    onError: (err: Error) => {
      toast.error('Repayment failed', {
        description: err.message || 'Please try again.',
      });
    },
  });

  const parsedAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const exceedsBalance = parsedAmount > availableBalance;
  const hasValidInput =
    parsedAmount > 0 && !exceedsBalance && pin.length === PIN_LENGTH;
  const canConfirm = hasValidInput && !isPending;

  const onConfirm = () => {
    if (!canConfirm || !loan) return;
    submitRepayment({
      loan_id: loan.loan_id,
      amount: parsedAmount,
      transaction_pin: pin,
    });
  };

  if (!loan && !successVisible) return null;

  return (
    <>
      {/* Payment Modal */}
      <Modal
        visible={visible && !!loan}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isPending) onClose();
        }}
      >
        <View className="flex-1 justify-end bg-black/40">
          <KeyboardAwareScrollView
            contentContainerClassName="flex-1 justify-end"
            bounces={false}
          >
            <View className="bg-white rounded-t-3xl px-6 pt-3 pb-16">
              <View className="w-10 h-1 rounded-full bg-[#D1D5DB] self-center mb-5" />

              <Text className="text-xl font-bold text-[#1A1A1A] text-center mb-6">
                Make Payment
              </Text>

              {/* Amount */}
              <Text className="text-sm font-medium text-[#1A1A1A] mb-2">Amount</Text>
              <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] mb-1.5">
                <TextInput
                  className="text-[15px] text-[#1A1A1A] p-0"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {exceedsBalance ? (
                <Text className="text-xs text-[#EF4444] mb-5">
                  Amount exceeds available balance
                </Text>
              ) : (
                <Text className="text-xs mb-5">
                  <Text className="text-[#6B7280]">Balance: </Text>
                  <Text className="text-[#472FF8] font-medium">
                    {formatCurrency(availableBalance)}
                  </Text>
                </Text>
              )}

              {/* PIN */}
              <Text className="text-sm font-medium text-[#1A1A1A] mb-2">Enter PIN</Text>
              <View className="bg-[#F5F5F5] rounded-xl px-4 py-[15px] mb-8 flex-row items-center">
                <TextInput
                  className="flex-1 text-[15px] text-[#1A1A1A] p-0"
                  value={pin}
                  onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, PIN_LENGTH))}
                  placeholder="••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPin}
                  keyboardType="number-pad"
                  maxLength={PIN_LENGTH}
                />
                <TouchableOpacity onPress={() => setShowPin((v) => !v)}>
                  <MaterialCommunityIcons
                    name={showPin ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm */}
              <TouchableOpacity
                className={`rounded-full py-4 items-center mb-3 ${
                  hasValidInput ? 'bg-[#472FF8]' : 'bg-[#E5E7EB]'
                }`}
                onPress={onConfirm}
                disabled={!canConfirm}
                activeOpacity={0.85}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    className={`text-base font-semibold ${
                      hasValidInput ? 'text-white' : 'text-[#9CA3AF]'
                    }`}
                  >
                    Confirm
                  </Text>
                )}
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity
                className="border-[1.5px] border-[#472FF8] rounded-full py-4 items-center"
                onPress={onClose}
                activeOpacity={0.85}
                disabled={isPending}
              >
                <Text className="text-[#472FF8] text-base font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={successVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSuccessVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl px-6 pt-3 pb-16 items-center">
            <View className="w-10 h-1 rounded-full bg-[#D1D5DB] self-center mb-8" />

            <MaterialCommunityIcons
              name="check-decagram"
              size={72}
              color="#16A34A"
            />

            <Text className="text-xl font-bold text-[#1A1A1A] mt-4 mb-8">
              Payment Successful!
            </Text>

            <TouchableOpacity
              className="bg-[#472FF8] rounded-full py-4 items-center w-full"
              onPress={() => setSuccessVisible(false)}
              activeOpacity={0.85}
            >
              <Text className="text-white text-base font-semibold">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
