import { Image, View } from 'react-native';

// Static logo on #472FF8, identical to the native splash (same asset, same
// size, same background) so the native→JS hand-off is seamless — no fade or
// scale entrance that would make the logo blink/re-animate on swap.
export function SplashScreenComponent(): React.JSX.Element {
  return (
    <View className="flex-1 bg-[#472FF8] items-center justify-center">
      <Image
        source={require('../../../assets/images/welcome/NeatLogo.png')}
        className="w-[200px] h-[200px]"
        resizeMode="contain"
      />
    </View>
  );
}
