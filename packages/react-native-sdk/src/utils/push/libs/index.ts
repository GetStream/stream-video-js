export * from './firebaseMessaging';
export * from './callingx';

/*
    NOTE: must keep each libs in different files
    Else on commonjs, metro doesnt resolve modules properly if one of the module is not installed
*/
