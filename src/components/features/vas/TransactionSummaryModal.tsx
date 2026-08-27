import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { InsufficientFundsHint } from '@/components/ui/insufficient-funds-hint';

import TransactionSummaryCard, {
  type TransactionSummary,
} from './TransactionSummaryCard';

interface TransactionSummaryModalProps extends TransactionSummary {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  /** Payable after cashback, e.g. "₦196.00". Renders the headline when present. */
  payableLabel?: string;
  /** Pre-cashback amount, struck through under the headline. Only when cashback is on. */
  strikeLabel?: string;
  /** Payable exceeds the wallet balance — blocks Save and shows the hint. */
  insufficient?: boolean;
}

export default function TransactionSummaryModal({
  visible,
  onClose,
  onSave,
  provider,
  phone,
  plan,
  smartcard,
  packageName,
  months,
  meter,
  meterType,
  amount,
  date,
  cashbackLabel,
  cashbackOn,
  onToggleCashback,
  payableLabel,
  strikeLabel,
  insufficient,
}: TransactionSummaryModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl px-6 pt-3 pb-16 max-h-[88%]">
          <View className="w-10 h-1 rounded-full bg-[#D1D5DB] self-center mb-5" />

          {/* The headline block makes the sheet noticeably taller, so the body
              scrolls to stay usable on short screens; the buttons stay pinned. */}
          <ScrollView
            className="shrink"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text className="text-xl font-bold text-[#1A1A1A] mb-5">
              Transaction Summary
            </Text>

            {payableLabel ? (
              <View className="items-center mb-5">
                <Text className="text-[32px] font-bold text-[#032252]">
                  {payableLabel}
                </Text>
                {strikeLabel ? (
                  <Text className="text-base text-[#9CA3AF] line-through mt-0.5">
                    {strikeLabel}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View className="mb-6">
              <TransactionSummaryCard
                provider={provider}
                phone={phone}
                plan={plan}
                smartcard={smartcard}
                packageName={packageName}
                months={months}
                meter={meter}
                meterType={meterType}
                amount={amount}
                date={date}
                cashbackLabel={cashbackLabel}
                cashbackOn={cashbackOn}
                onToggleCashback={onToggleCashback}
              />
            </View>
          </ScrollView>

          {insufficient ? <InsufficientFundsHint show /> : null}

          <TouchableOpacity
            className={`rounded-full py-4 items-center mb-3 ${
              insufficient ? 'bg-[#E5E7EB]' : 'bg-[#F9B700]'
            }`}
            onPress={onSave}
            disabled={insufficient}
            activeOpacity={0.85}
          >
            <Text
              className={`text-base font-semibold ${
                insufficient ? 'text-[#9CA3AF]' : 'text-[#032252]'
              }`}
            >
              Save
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="border-[1.5px] border-[#032252] rounded-full py-4 items-center"
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text className="text-[#032252] text-base font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
