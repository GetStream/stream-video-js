export type MessagingModule = typeof import('@react-native-firebase/messaging');

let lib: MessagingModule | undefined;

try {
  lib = require('@react-native-firebase/messaging');
} catch {}

export { lib };

/*
    IMPORTANT: must keep a failing import in a different file
    Else on commonjs, metro doesnt resolve any other modules properly in a file, if one of the module is not installed
*/
