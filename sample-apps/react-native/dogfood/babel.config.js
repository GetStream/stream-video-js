module.exports = function (api) {
  // we disable caching for picking up changes in the environment variables - https://www.npmjs.com/package/react-native-dotenv
  api.cache(false);

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: ['module:react-native-dotenv', 'react-native-reanimated/plugin'],
  };
};
