module.exports = {
  presets: ['@rnx-kit/babel-preset-metro-react-native'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module:react-native-dotenv',
      {
        moduleName: 'react-native-dotenv',
        path: '.env',
      },
    ],
  ],
};
