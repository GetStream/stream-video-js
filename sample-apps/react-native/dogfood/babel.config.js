module.exports = {
  presets: ['@rnx-kit/babel-preset-metro-react-native'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module:react-native-dotenv',
      // Added for Chat SDK
      {
        moduleName: 'react-native-dotenv',
        path: '.env',
      },
    ],
  ],
};
