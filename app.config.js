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
  updates: {
    url: 'https://u.expo.dev/13db6f2a-3ded-4ad6-a2fe-9bf7904bc5e8',
    // url: 'https://u.expo.dev/a2f6a1a2-cb4a-4172-a7a8-eefc69413ec7',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription:
        'NeatPay needs your camera to verify your identity with a quick selfie.',
      // Liveness is selfie-only for now — no audio captured. Re-enable when
      // active/video liveness ships (keeps Data Safety form clean).
      // NSMicrophoneUsageDescription:
      //   'NeatPay uses your microphone during identity verification.',
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
    // RECORD_AUDIO removed for now — liveness is selfie-only (no audio capture).
    // Re-add 'android.permission.RECORD_AUDIO' when active/video liveness ships.
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
        image: './assets/images/welcome/NeatLogo.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#472FF8',
      },
    ],
    [
      'expo-notifications',
      {
        // Monochrome white-on-transparent "N" — Android renders the small icon
        // from the alpha channel only, tinting it with `color` in the shade and
        // forcing white in the status bar. A full-colour wordmark would smudge.
        icon: './assets/images/notification-icon.png',
        color: '#472FF8',
        defaultChannel: 'transactions',
      },
    ],
    '@react-native-community/datetimepicker',
    'expo-web-browser',
    ['freerasp-react-native', {}],
    [
      'expo-build-properties',
      {
        // Security review (CyberPlural): raise Android floor from API 24 (Android 7.0,
        // unpatched) to API 29 (Android 10) so the app only runs on devices still getting
        // OS security updates. Drops Android 7–9 support.
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
