// @ts-check
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Wrap NativeWind in try-catch to handle web build issues gracefully
try {
  const { withNativeWind } = require("nativewind/metro");
  module.exports = withNativeWind(config, {
    input: "./global.css",
  });
} catch (error) {
  // If NativeWind fails to load, use default config
  console.warn("NativeWind metro plugin failed to load, using default config:", error.message);
  module.exports = config;
}
