export type Type = typeof import('@react-native-firebase/messaging').default;

let lib: Type | undefined;

try {
  lib = require('@react-native-firebase/messaging').default;
} catch {}

export { lib };

/*
    IMPORTANT: must keep a failing import in a different file
    Else on commonjs, metro doesnt resolve any other modules properly in a file, if one of the module is not installed
*/
