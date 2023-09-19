module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', '@rnx-kit/babel-preset-metro-react-native'],
    plugins: ['react-native-reanimated/plugin', 'expo-router/babel'],
  };
};
