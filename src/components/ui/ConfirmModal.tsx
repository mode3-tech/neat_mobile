import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmStyle?: 'primary' | 'danger';
}

export function ConfirmModal({
  visible,
  title,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  confirmStyle = 'primary',
}: ConfirmModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onCancel}>
        <Pressable
          className="bg-white rounded-t-3xl px-6 pt-4"
          style={{ paddingBottom: 20 + insets.bottom }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-12 h-1 rounded-full bg-gray-300 self-center mb-6" />

          <Text className="text-xl font-bold text-[#1A1A1A] text-center mb-6">
            {title}
          </Text>

          <TouchableOpacity
            className={`rounded-full py-4 items-center mb-3 ${
              confirmStyle === 'danger' ? 'bg-[#EF4444]' : 'bg-[#472FF8]'
            }`}
            onPress={onConfirm}
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-semibold">{confirmLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-full py-4 items-center bg-[#F3F4F6]"
            onPress={onCancel}
            activeOpacity={0.85}
          >
            <Text className="text-[#472FF8] text-base font-semibold">{cancelLabel}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
