/** @typedef {import('jest').Config} */
const config = {
  rootDir: __dirname,
  testEnvironment: 'node',
  testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
  // the plugin is plain node TypeScript, so it only needs type stripping plus
  // the commonjs module transform that jest expects
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
        ],
      },
    ],
  },
};

module.exports = config;
