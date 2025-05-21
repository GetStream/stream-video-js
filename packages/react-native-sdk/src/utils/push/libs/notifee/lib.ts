export type Type = typeof import('@notifee/react-native');

let lib: Type | undefined;

try {
  lib = require('@notifee/react-native');
} catch {}

export { lib };

/*
    IMPORTANT: must keep a failing import in a different file
    Else on commonjs, metro doesnt resolve any other modules properly in a file, if one of the module is not installed
*/
