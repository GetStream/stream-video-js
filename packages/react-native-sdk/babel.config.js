module.exports = function (api) {
  const isTest = api.env('test');

  if (isTest) {
    return {
      presets: [
        'module:@react-native/babel-preset',
        '@babel/preset-typescript',
      ],
    };
  }
  return {
    presets: ['module:@react-native/babel-preset'],
  };
};
