import { ActivityIndicator, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmStyle?: 'primary' | 'danger';
  loading?: boolean;
  /** Hides the cancel button — for info-only acknowledgements. */
  hideCancel?: boolean;
}

export function ConfirmModal({
  visible,
  title,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  confirmStyle = 'primary',
  loading = false,
  hideCancel = false,
}: ConfirmModalProps) {
  const insets = useSafeAreaInsets();
  const noop = () => {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={loading ? noop : onCancel}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={loading ? noop : onCancel}
      >
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
            className={`rounded-full py-4 items-center ${hideCancel ? '' : 'mb-3'} ${
              confirmStyle === 'danger' ? 'bg-[#EF4444]' : 'bg-[#472FF8]'
            }`}
            onPress={onConfirm}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">{confirmLabel}</Text>
            )}
          </TouchableOpacity>

          {!hideCancel && (
            <TouchableOpacity
              className="rounded-full py-4 items-center bg-[#F3F4F6]"
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text className={`text-base font-semibold ${loading ? 'text-gray-400' : 'text-[#472FF8]'}`}>
                {cancelLabel}
              </Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
