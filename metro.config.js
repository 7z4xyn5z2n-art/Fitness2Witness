const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle NativeWind cache files
config.resolver = {
  ...config.resolver,
  // Ensure cache directory is watched
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
  },
};

// Add watcher configuration to include NativeWind cache (only in development)
if (process.env.NODE_ENV === "development") {
  config.watchFolders = [
    ...(config.watchFolders || []),
    path.resolve(__dirname, "node_modules/react-native-css-interop/.cache"),
  ];
}

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Disable forceWriteFileSystem for production builds (Netlify)
  // This prevents cache file issues during static export
  forceWriteFileSystem: process.env.NODE_ENV === "development",
});
