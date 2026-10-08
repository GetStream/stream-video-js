import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import { Commands } from '../../src/native/RTCViewPipNativeComponent';
import {
  onNativeCallClosed,
  onNativeDimensionsUpdated,
  RTCViewPipNative,
  type RTCViewPipNativeRef,
} from '../../src/components/Call/CallContent/RTCViewPipNative';

const mockCommands = Commands as jest.Mocked<typeof Commands>;
const viewRef = {} as RTCViewPipNativeRef;

describe('RTCViewPipNative', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    Platform.OS = originalOS;
  });

  describe('on iOS', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('dispatches the onCallClosed command to the view', () => {
      onNativeCallClosed(viewRef);
      expect(mockCommands.onCallClosed).toHaveBeenCalledWith(viewRef);
    });

    it('dispatches the setPreferredContentSize command to the view', () => {
      onNativeDimensionsUpdated(viewRef, 320, 180);
      expect(mockCommands.setPreferredContentSize).toHaveBeenCalledWith(
        viewRef,
        320,
        180,
      );
    });

    it('skips the commands without a mounted view', () => {
      onNativeCallClosed(null);
      onNativeDimensionsUpdated(null, 320, 180);
      expect(mockCommands.onCallClosed).not.toHaveBeenCalled();
      expect(mockCommands.setPreferredContentSize).not.toHaveBeenCalled();
    });

    it('renders the native view and forwards the ref', () => {
      const ref = React.createRef<RTCViewPipNativeRef>();
      const { toJSON } = render(
        <RTCViewPipNative ref={ref} streamURL="stream" hasAudio={false} />,
      );
      expect(toJSON()).toMatchObject({
        props: { streamURL: 'stream', hasAudio: false, pointerEvents: 'none' },
      });
      expect(ref.current).not.toBeNull();
    });
  });

  describe('on Android', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    it('does not dispatch any command', () => {
      onNativeCallClosed(viewRef);
      onNativeDimensionsUpdated(viewRef, 320, 180);
      expect(mockCommands.onCallClosed).not.toHaveBeenCalled();
      expect(mockCommands.setPreferredContentSize).not.toHaveBeenCalled();
    });

    it('renders nothing', () => {
      const { toJSON } = render(<RTCViewPipNative streamURL="stream" />);
      expect(toJSON()).toBeNull();
    });
  });
});
