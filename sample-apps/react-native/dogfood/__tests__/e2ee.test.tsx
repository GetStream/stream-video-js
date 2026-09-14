import React from 'react';
import { act, cleanupAsync, renderAsync } from '@testing-library/react-native';
import {
  type Call,
  EncryptionManager,
} from '@stream-io/video-react-native-sdk';
import { attachE2EEIfConfigured } from '../src/utils/e2ee';
import { mmkvStorage } from '../src/contexts/createStoreContext';
import { MeetingUI } from '../src/components/MeetingUI';

let mockCall: ReturnType<typeof createCall>;
let mockJoin: () => Promise<void>;
let mockErrorMessage: string | undefined;

jest.mock(
  '@stream-io/video-react-native-sdk',
  () => ({
    EncryptionManager: class {
      static isSupported: () => boolean = () => true;
      static create = jest.fn();
    },
    EncryptionSettingsRequestModeEnum: { AUTO_ON: 'auto-on' },
    EncryptionSettingsResponseModeEnum: { AUTO_ON: 'auto-on' },
    CallingState: { LEFT: 'left' },
    useCall: () => mockCall,
    useI18n: () => ({ t: (key: string) => key }),
    useCallStateHooks: () => ({
      useCallCallingState: () => mockCall.state.callingState,
    }),
  }),
  { virtual: true },
);
jest.mock('react-native-quick-crypto', () => ({ pbkdf2Sync: jest.fn() }));
jest.mock('../src/contexts/createStoreContext', () => ({
  mmkvStorage: { getString: jest.fn() },
}));
jest.mock('../src/contexts/AppContext', () => ({
  useAppGlobalStoreSetState: () => jest.fn(),
}));
jest.mock('../src/contexts/LayoutContext', () => ({
  LayoutProvider: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock('../src/components/LobbyViewComponent', () => ({
  LobbyViewComponent: (props: { onJoinCallHandler: () => Promise<void> }) => {
    mockJoin = props.onJoinCallHandler;
    return null;
  },
}));
jest.mock('../src/components/ActiveCall', () => ({ ActiveCall: () => null }));
jest.mock('../src/components/AuthenticatingProgress', () => ({
  AuthenticationProgress: () => null,
}));
jest.mock('../src/components/CallErrorComponent', () => ({
  CallErrorComponent: ({ message }: { message: string }) => {
    mockErrorMessage = message;
    return null;
  },
}));

const createCall = () => {
  const call = {
    currentUserId: undefined as string | undefined,
    state: { callingState: 'idle' },
    setE2EEManager: jest.fn(),
    join: jest.fn().mockResolvedValue(undefined),
    leave: jest.fn(async () => {
      call.state.callingState = 'left';
    }),
  };
  return call;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCall = createCall();
  mockErrorMessage = undefined;
  jest
    .mocked(mmkvStorage.getString)
    .mockReturnValue(JSON.stringify('test-key'));
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(async () => {
  await cleanupAsync();
  jest.restoreAllMocks();
});

it.each([undefined, ''])(
  'rejects E2EE setup without a user (%s)',
  async (id) => {
    mockCall.currentUserId = id;
    await expect(
      attachE2EEIfConfigured(mockCall as unknown as Call),
    ).rejects.toThrow('Cannot enable E2EE before the user is connected');
    expect(EncryptionManager.create).not.toHaveBeenCalled();
    expect(mockCall.setE2EEManager).not.toHaveBeenCalled();
  },
);

it('remains a no-op without a configured key', async () => {
  jest.mocked(mmkvStorage.getString).mockReturnValue(undefined);
  await expect(
    attachE2EEIfConfigured(mockCall as unknown as Call),
  ).resolves.toBeUndefined();
  expect(EncryptionManager.create).not.toHaveBeenCalled();
});

it('shows the setup error and ends the meeting flow before joining', async () => {
  type Props = React.ComponentProps<typeof MeetingUI>;
  await renderAsync(
    <MeetingUI
      callId="test-call"
      navigation={{} as Props['navigation']}
      route={{} as Props['route']}
    />,
  );
  await act(async () => mockJoin());

  expect(mockCall.join).not.toHaveBeenCalled();
  expect(mockCall.leave).toHaveBeenCalledTimes(1);
  expect(mockErrorMessage).toBe(
    'Cannot enable E2EE before the user is connected',
  );
});
