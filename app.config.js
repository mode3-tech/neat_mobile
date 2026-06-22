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
  icon: './assets/images/adap-ic.png',
  scheme: 'neatmobile',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  updates: {
    // url: 'https://u.expo.dev/13db6f2a-3ded-4ad6-a2fe-9bf7904bc5e8',
    url: 'https://u.expo.dev/a2f6a1a2-cb4a-4172-a7a8-eefc69413ec7',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription:
        'NeatPay needs your camera to verify your identity with a quick selfie.',
      NSMicrophoneUsageDescription:
        'NeatPay uses your microphone during identity verification.',
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
    permissions: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO'],
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
        image: './assets/images/welcome/NeatLogo.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#472FF8',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/home-logo.png',
        color: '#472FF8',
        defaultChannel: 'transactions',
      },
    ],
    '@react-native-community/datetimepicker',
    'expo-web-browser',
    ['freerasp-react-native', {}],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      // projectId: '13db6f2a-3ded-4ad6-a2fe-9bf7904bc5e8',
      projectId: 'a2f6a1a2-cb4a-4172-a7a8-eefc69413ec7',
    },
  },
  owner: 'morojuoluwa',
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
