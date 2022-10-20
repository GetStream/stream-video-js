const path = require('path');

const getWorkspaces = require('get-yarn-workspaces');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const workspaces = getWorkspaces(__dirname);

module.exports = {
  projectRoot: path.resolve(__dirname, '.'),

  watchFolders: [path.resolve(__dirname, '../../node_modules'), ...workspaces],

  resolver: {
    blacklistRE: exclusionList(
      workspaces.map(
        (workspacePath) =>
          `/${workspacePath.replace(
            /\//g,
            '[/\\\\]',
          )}[/\\\\]node_modules[/\\\\]react-native[/\\\\].*/`,
      ),
    ),
    extraNodeModules: {
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
    },
  },
};
