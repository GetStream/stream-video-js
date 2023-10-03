const {
  makeMetroConfig,
  resolveUniqueModule,
} = require('@rnx-kit/metro-config');
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks');

const projectRoot = __dirname;

// find the deps of the app
const dependencyPackageNames = Object.keys(
  require('./package.json').dependencies,
);

const uniqueModules = dependencyPackageNames.map((packageName) => {
  const [modulePath, blockPattern] = resolveUniqueModule(
    packageName,
    projectRoot,
  );
  return {
    packageName, // name of the package
    modulePath, // actual path to the module in the project's node modules
    blockPattern, // paths that match this pattern will be blocked from being resolved
  };
});

// add all the unique block patterns to the block list
const blockList = uniqueModules.map(({ blockPattern }) => blockPattern);

// where to find the unique modules?
const extraNodeModules = uniqueModules.reduce((acc, item) => {
  acc[item.packageName] = item.modulePath;
  return acc;
}, {});

const getConfig = async () => {
  const config = makeMetroConfig({
    resolver: {
      resolveRequest: MetroSymlinksResolver(),
      extraNodeModules,
      blockList,
    },
  });
  return config;
};

module.exports = getConfig();
