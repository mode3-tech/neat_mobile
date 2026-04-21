import { useEffect, useRef } from 'react';
import { Animated, Image, Text, View } from 'react-native';

export function SplashScreenComponent(): React.JSX.Element {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View className="flex-1 bg-[#472FF8] items-center justify-center">
      <Animated.View
        className="items-center"
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Image
          source={require('../../../assets/images/adap-ic.png')}
          className="w-[100px] h-[100px]"
          resizeMode="contain"
        />
        <Text className="text-white text-3xl font-semibold mt-3">
          Neatpay
        </Text>
      </Animated.View>
    </View>
  );
}
