export type Type = typeof import('@stream-io/noise-cancellation-react-native');

let noiseCancellationLib: Type | undefined;

try {
  noiseCancellationLib = require('@stream-io/noise-cancellation-react-native');
} catch {}

export function getNoiseCancellationLibThrowIfNotInstalled() {
  if (!noiseCancellationLib) {
    throw Error(
      '@stream-io/noise-cancellation-react-native is not installed. It is required for implementing noise cancellation. ',
    );
  }
  return noiseCancellationLib;
}

export class NoiseCancellationWrapper {
  private static noiseCancellationInstance:
    | InstanceType<Type['NoiseCancellation']>
    | undefined;

  private constructor() {}

  static getInstance(): InstanceType<Type['NoiseCancellation']> {
    if (!this.noiseCancellationInstance) {
      const ncLib = getNoiseCancellationLibThrowIfNotInstalled();
      this.noiseCancellationInstance = new ncLib.NoiseCancellation();
    }
    return this.noiseCancellationInstance;
  }
}

/*
    IMPORTANT: must keep a failing import in a different file
    Else on commonjs, metro doesnt resolve any other modules properly in a file, if one of the module is not installed
*/
