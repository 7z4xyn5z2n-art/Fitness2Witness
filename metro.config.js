const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Only use NativeWind for native platforms, not web
// Web builds use standard Tailwind CSS processing
if (process.env.EXPO_PUBLIC_PLATFORM !== 'web') {
  try {
    const { withNativeWind } = require("nativewind/metro");
    module.exports = withNativeWind(config, {
      input: "./global.css",
    });
  } catch (e) {
    // If NativeWind fails to load, just use default config
    module.exports = config;
  }
} else {
  module.exports = config;
}
