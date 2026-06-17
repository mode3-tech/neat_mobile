import { Modal, Text, TouchableOpacity, View } from 'react-native';

import TransactionSummaryCard, {
  type TransactionSummary,
} from './TransactionSummaryCard';

interface TransactionSummaryModalProps extends TransactionSummary {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
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
}: TransactionSummaryModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl px-6 pt-3 pb-16">
          <View className="w-10 h-1 rounded-full bg-[#D1D5DB] self-center mb-5" />

          <Text className="text-xl font-bold text-[#1A1A1A] mb-5">
            Transaction Summary
          </Text>

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
            />
          </View>

          <TouchableOpacity
            className="bg-[#472FF8] rounded-full py-4 items-center mb-3"
            onPress={onSave}
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-semibold">Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="border-[1.5px] border-[#472FF8] rounded-full py-4 items-center"
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text className="text-[#472FF8] text-base font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
