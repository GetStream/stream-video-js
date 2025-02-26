module.exports = function (api) {
  api && api.cache && api.cache(false);
  const isTest = api.env('test');
  if (isTest) {
    // https://jestjs.io/docs/getting-started#using-typescript
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
