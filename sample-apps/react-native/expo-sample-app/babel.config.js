module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['@rnx-kit/babel-preset-metro-react-native'],
    plugins: [
      'react-native-reanimated/plugin',
      'expo-router/babel',
      [
        'module:react-native-dotenv',
        {
          moduleName: 'react-native-dotenv',
          path: '.env',
        },
      ],
    ],
  };
};
