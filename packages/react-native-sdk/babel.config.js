module.exports = function () {
  api.cache(true);
  return {
    presets: ['module:@react-native/babel-preset'],
  };
};
