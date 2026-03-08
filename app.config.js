const baseConfig = require('./app.json');

const variants = {
  development: {
    name: 'NeatPay (Dev)',
    android: { package: 'com.mode3.neatmobile.dev' },
    ios: { bundleIdentifier: 'com.mode3.neatmobile.dev' },
  },
  preview: {
    name: 'NeatPay (Preview)',
    android: { package: 'com.mode3.neatmobile.preview' },
    ios: { bundleIdentifier: 'com.mode3.neatmobile.preview' },
  },
};

const variant = variants[process.env.APP_VARIANT];

module.exports = {
  expo: {
    ...baseConfig.expo,
    ...(variant && { name: variant.name }),
    android: {
      ...baseConfig.expo.android,
      ...(variant && { package: variant.android.package }),
    },
    ios: {
      ...baseConfig.expo.ios,
      ...(variant && { bundleIdentifier: variant.ios.bundleIdentifier }),
    },
  },
};
