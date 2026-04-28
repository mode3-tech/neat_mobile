import { Alert, Image, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';

interface PhotoPickerSheetProps {
  visible: boolean;
  currentPhotoUri: string | null;
  onClose: () => void;
  onSelect: (uri: string) => void;
}

function persistToDocuments(pickedUri: string): string {
  try {
    const rawExt = pickedUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const ext = ['jpg', 'jpeg', 'png', 'heic'].includes(rawExt) ? rawExt : 'jpg';
    const dest = new File(Paths.document, `profile-photo-${Date.now()}.${ext}`);
    const source = new File(pickedUri);
    source.copy(dest);
    return dest.uri;
  } catch {
    return pickedUri;
  }
}

export function PhotoPickerSheet({
  visible,
  currentPhotoUri,
  onClose,
  onSelect,
}: PhotoPickerSheetProps) {
  const insets = useSafeAreaInsets();

  const handlePicked = (pickedUri: string) => {
    const stableUri = persistToDocuments(pickedUri);
    onSelect(stableUri);
    onClose();
  };

  const pickFromAlbum = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your photo library.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        handlePicked(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open photo library. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your camera.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        handlePicked(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open camera. Please try again.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable
          className="bg-white rounded-t-3xl px-6 pt-4"
          style={{ paddingBottom: 24 + insets.bottom }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-12 h-1 rounded-full bg-gray-300 self-center mb-6" />

          <View className="items-center mb-6">
            <View className="w-28 h-28 rounded-full bg-gray-100 items-center justify-center overflow-hidden">
              {currentPhotoUri ? (
                <Image source={{ uri: currentPhotoUri }} className="w-full h-full" />
              ) : (
                <MaterialCommunityIcons name="camera" size={36} color="#9CA3AF" />
              )}
            </View>
          </View>

          <TouchableOpacity
            className="rounded-full py-4 items-center border-2 border-[#472FF8] mb-3"
            onPress={pickFromAlbum}
            activeOpacity={0.85}
          >
            <Text className="text-[#472FF8] text-base font-semibold">Select from album</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-full py-4 items-center border-2 border-[#472FF8]"
            onPress={takePhoto}
            activeOpacity={0.85}
          >
            <Text className="text-[#472FF8] text-base font-semibold">Take a Photo</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
