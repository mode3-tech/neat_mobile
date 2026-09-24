const variants = {
  development: {
    name: 'NeatPay (Dev)',
    android: { package: 'com.mode3.neatmobile.dev' },
    ios: { bundleIdentifier: 'com.mode3.neatmobile.dev' },
  },
  preview: {
    name: 'NeatPay',
    android: { package: 'com.mode3.neatmobile.preview' },
    ios: { bundleIdentifier: 'com.mode3.neatmobile.preview' },
  },
};

const variant = variants[process.env.APP_VARIANT];

const baseConfig = {
  name: 'NEATPay',
  slug: 'neat-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/test-logo.png',
  scheme: 'neatmobile',
  userInterfaceStyle: 'light',
  newArchEnabled: true,

  androidNavigationBar: {
    enforceContrast: false,
    barStyle: 'light-content',
  },
  updates: {
    url: 'https://u.expo.dev/13db6f2a-3ded-4ad6-a2fe-9bf7904bc5e8',
    // url: 'https://u.expo.dev/a2f6a1a2-cb4a-4172-a7a8-eefc69413ec7',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.mode3.neatmobile',
    icon: './assets/images/ios-icon.png',
    config: {
      // Only valid while France is excluded in App Store Connect → Pricing and
      // Availability: freeRASP bundles its own OpenSSL, and that standard,
      // non-Apple encryption needs a French encryption declaration there.
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      // react-native-screens applies each route's statusBarStyle only when this
      // is on; Expo's template defaults it to false, which leaves navy screens
      // with invisible dark icons on iOS.
      UIViewControllerBasedStatusBarAppearance: true,
      // Launch storyboard only; once the app is up, each route's statusBarStyle wins.
      UIStatusBarStyle: 'UIStatusBarStyleLightContent',
      NSCameraUsageDescription:
        'NEATPay uses your camera to verify your identity with a quick selfie and to take your profile photo.',
      NSFaceIDUsageDescription:
        'NEATPay uses Face ID to sign you in and confirm transactions.',
      NSPhotoLibraryUsageDescription:
        'NEATPay needs access to your photos so you can choose a profile picture.',
      NSPhotoLibraryAddUsageDescription:
        'NEATPay saves receipts and QR codes to your photos when you choose to.',

      // NSMicrophoneUsageDescription:
      //   'NEATPay uses your microphone during identity verification.',
    },
  },
  android: {
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#032252',
      foregroundImage: './assets/images/test-logo.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    softwareKeyboardLayoutMode: 'resize',
    predictiveBackGestureEnabled: false,
    package: 'com.mode3.neatmobile',

    permissions: ['android.permission.CAMERA'],
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
     
        image: './assets/images/new/splash-logo.png',
        imageWidth: 240,
        resizeMode: 'contain',
        backgroundColor: '#032252',
      },
    ],
    [
      'expo-notifications',
      {

        icon: './assets/images/notification-icon-color.png',

        color: '#032252',
        defaultChannel: 'transactions',
      },
    ],
    '@react-native-community/datetimepicker',
    'expo-web-browser',
    ['expo-image-picker', { microphonePermission: false }],
    ['freerasp-react-native', {}],
    [
      'expo-build-properties',
      {

        android: { minSdkVersion: 29 },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: '13db6f2a-3ded-4ad6-a2fe-9bf7904bc5e8',
      // projectId: 'a2f6a1a2-cb4a-4172-a7a8-eefc69413ec7',
    },
  },
  owner: 'micropayafrica',
  // owner: 'morojuoluwa',
};

module.exports = {
  expo: {
    ...baseConfig,
    ...(variant && { name: variant.name }),
    android: {
      ...baseConfig.android,
      ...(variant && { package: variant.android.package }),
    },
    ios: {
      ...baseConfig.ios,
      ...(variant && { bundleIdentifier: variant.ios.bundleIdentifier }),
    },
  },
};
