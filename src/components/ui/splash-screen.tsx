import { Image, View } from 'react-native';

import { NavBar } from './nav-bar';

// Static logo on #032252, identical to the native splash (same asset, same
// size, same background) so the native→JS hand-off is seamless — no fade or
// scale entrance that would make the logo blink/re-animate on swap. The 263x87
// box is the asset's 1x size and mirrors `imageWidth: 263` in app.config.js;
// changing one without the other reintroduces the blink.
export function SplashScreenComponent(): React.JSX.Element {
  return (
    <View className="flex-1 bg-[#032252] items-center justify-center">
      {/* Light status bar icons for this navy screen come from the index
          route's `statusBarStyle: 'light'` in _layout.tsx — a nested
          <StatusBar> here would lose to the root one, which mounts later. */}
      <NavBar style="light" />
      <Image
        source={require('../../../assets/images/new/logo-neat.png')}
        className="w-[263px] h-[87px]"
        resizeMode="contain"
      />
    </View>
  );
}
