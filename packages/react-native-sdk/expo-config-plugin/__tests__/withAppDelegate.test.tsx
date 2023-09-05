import { getFixture } from '../fixtures/index';
import {
  addStreamVideoReactNativeSDKAppDelegateImport,
  addStreamVideoReactNativeSDKAppDelegateSetup,
} from '../src/withAppDelegate';

const ExpoModulesAppDelegate = getFixture('AppDelegate.mm');

describe(addStreamVideoReactNativeSDKAppDelegateImport, () => {
  it('adds import to Expo Modules AppDelegate', () => {
    const results = addStreamVideoReactNativeSDKAppDelegateImport(
      ExpoModulesAppDelegate,
    );
    expect(results.contents).toMatch(/#import "StreamVideoReactNative.h"/);
    expect(results.didMerge).toBe(true);
    expect(results.didClear).toBe(false);
  });

  it(`fails to add to a malformed app delegate`, () => {
    expect(() =>
      addStreamVideoReactNativeSDKAppDelegateImport(`foobar`),
    ).toThrow(/foobar/);
  });
});

describe(addStreamVideoReactNativeSDKAppDelegateSetup, () => {
  it('adds setup to Expo Modules AppDelegate', () => {
    const results = addStreamVideoReactNativeSDKAppDelegateSetup(
      ExpoModulesAppDelegate,
    );
    expect(results.contents).toMatch(/\[StreamVideoReactNative setup\];/);
    expect(results.didMerge).toBe(true);
    expect(results.didClear).toBe(false);
  });

  it(`fails to add to a malformed app delegate`, () => {
    expect(() =>
      addStreamVideoReactNativeSDKAppDelegateImport(`foobar`),
    ).toThrow(/foobar/);
  });
});
