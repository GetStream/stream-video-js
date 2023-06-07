module.exports = {
  "stories": [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions"
  ],
  "framework": "@storybook/react",
  "core": {
    "builder": "@storybook/builder-vite"
  },
  "features": {
    "storyStoreV7": true
  },
  env: (config) => {
    console.log(config);
    return {
      ...config,
      EXAMPLE_VAR: 'An environment variable configured in Storybook',
      STORYBOOK_ENV: 'bla',
    }
  },
}
