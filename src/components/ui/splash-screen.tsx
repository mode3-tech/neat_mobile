import { Image, View } from 'react-native';

import { NavBar } from './nav-bar';

// Static logo on #032252, identical to the native splash (same asset, same
// size, same background) so the native→JS hand-off is seamless — no fade or
// scale entrance that would make the logo blink/re-animate on swap. The 240x240
// box mirrors `imageWidth: 240` in app.config.js — the asset is a square canvas
// with the wordmark at 68% width, so it renders ~163dp wide here. Changing one
// without the other reintroduces the blink; see app.config.js for why 240 and
// not the full 288dp canvas (Android 12+ masks the native splash icon to the
// inner 192dp circle, and at 288 the wordmark's ends fell outside it).
export function SplashScreenComponent(): React.JSX.Element {
  return (
    <View className="flex-1 bg-[#032252] items-center justify-center">
      {/* Light status bar icons for this navy screen come from the index
          route's `statusBarStyle: 'light'` in _layout.tsx — a nested
          <StatusBar> here would lose to the root one, which mounts later. */}
      <NavBar style="light" />
      <Image
        source={require('../../../assets/images/new/splash-logo.png')}
        className="w-[240px] h-[240px]"
        resizeMode="contain"
      />
    </View>
  );
}
