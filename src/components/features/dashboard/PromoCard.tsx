import { Image, Text, View } from 'react-native';

export default function PromoCard() {
  return (
    <View className="mx-6 rounded-2xl overflow-hidden">
      <Image
        source={require('../../../../assets/images/dashboard/New Notification.png')}
        className="w-full h-[180px]"
        resizeMode="contain"
      />
    </View>
  );
}
