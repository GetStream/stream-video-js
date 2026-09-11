import { act, cleanupAsync, renderHook } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import {
  CallingState,
  type StreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import {
  useDeepLinkEffect,
  useEncryptedDeepLinkEffect,
  deeplinkCallId$,
} from '../src/hooks/useDeepLinkEffect';

const mockClient = {
  state: { calls: [] as { state: { callingState: CallingState } }[] },
};
let mockEnvironment = 'pronto';
let mockRoute = 'JoinMeetingScreen';
const mockSetState = jest.fn();

// This app-level test runs before SDK builds in CI. Mock only the SDK API it uses.
jest.mock(
  '@stream-io/video-react-native-sdk',
  () => ({
    CallingState: {
      UNKNOWN: 'unknown',
      IDLE: 'idle',
      RINGING: 'ringing',
      JOINING: 'joining',
      JOINED: 'joined',
      LEFT: 'left',
      RECONNECTING: 'reconnecting',
    },
  }),
  { virtual: true },
);
jest.mock('../src/contexts/AppContext', () => ({
  useAppGlobalStoreSetState: () => mockSetState,
  useAppGlobalStoreValue: (selector: any) =>
    selector({ appEnvironment: mockEnvironment }),
}));
jest.mock('../src/utils/staticNavigationUtils', () => ({
  navigationRef: { getCurrentRoute: () => ({ name: mockRoute }) },
}));

const link = 'https://pronto.getstream.io/join/call-123?encryption_key=new-key';
const encryptedLinks = [
  {
    environment: 'demo',
    url: 'https://getstream.io/video/demos/join/call-123?encryption_key=new-key',
  },
  { environment: 'pronto', url: link },
  {
    environment: 'pronto-staging',
    url: 'https://pronto-staging.getstream.io/join/call-123?encryption_key=new-key',
  },
];
let receiveURL: (event: { url: string }) => void;
const removeListener = jest.fn();
const mockSubscription = Linking.addEventListener('url', () => {});
mockSubscription.remove = removeListener;
const openURL = (url = link) => act(() => receiveURL({ url }));
const useClientLinks = () =>
  useEncryptedDeepLinkEffect(mockClient as unknown as StreamVideoClient);

beforeEach(() => {
  mockEnvironment = 'pronto';
  mockRoute = 'JoinMeetingScreen';
  mockClient.state.calls = [];
  mockSetState.mockReset();
  removeListener.mockClear();
  deeplinkCallId$.next(undefined);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
  jest.spyOn(Linking, 'addEventListener').mockImplementation((_, handler) => {
    receiveURL = handler;
    return mockSubscription;
  });
});

afterEach(async () => {
  await cleanupAsync();
  jest.restoreAllMocks();
});

const listen = async () => {
  renderHook(useDeepLinkEffect);
  await act(async () => {});
};

it.each(encryptedLinks)(
  'retains a $environment cold-start key through login and saves it before navigation',
  async ({ environment, url }) => {
    mockEnvironment = environment;
    jest.mocked(Linking.getInitialURL).mockResolvedValue(url);
    await listen();
    expect(mockSetState).not.toHaveBeenCalled();
    expect(deeplinkCallId$.value).toBeUndefined();
    const subscription = deeplinkCallId$.subscribe((callId) => {
      if (callId) {
        expect(mockSetState).toHaveBeenCalledWith({ e2eeKeyInput: 'new-key' });
      }
    });
    const view = renderHook(useClientLinks);
    expect(deeplinkCallId$.value).toBe('call-123');
    view.unmount();
    renderHook(useClientLinks);
    expect(mockSetState).toHaveBeenCalledTimes(1);
    subscription.unsubscribe();
  },
);

it.each(['https', 'streamvideo'])(
  'accepts a %s Pronto link while running',
  async (scheme) => {
    await listen();
    renderHook(useClientLinks);
    openURL(
      `${scheme}://pronto.getstream.io/join/call-123?encryption_key=%20new%2Bkey%20`,
    );
    expect(mockSetState).toHaveBeenCalledWith({ e2eeKeyInput: 'new+key' });
    expect(deeplinkCallId$.value).toBe('call-123');
  },
);

it.each(encryptedLinks)(
  'alerts outside $environment without saving or navigating, and does not retry on switching',
  async ({ environment, url }) => {
    await listen();
    mockEnvironment = environment === 'pronto' ? 'demo' : 'pronto';
    const view = renderHook(useClientLinks);
    openURL(url);
    expect(Alert.alert).toHaveBeenCalledWith(
      `Switch to ${environment} to open this link`,
    );
    mockEnvironment = environment;
    view.rerender({});
    expect(mockSetState).not.toHaveBeenCalled();
    expect(deeplinkCallId$.value).toBeUndefined();
  },
);

it.each([
  CallingState.JOINING,
  CallingState.JOINED,
  CallingState.RECONNECTING,
  CallingState.RINGING,
])(
  'checks the latest call state (%s) without waiting for a render',
  async (callingState) => {
    await listen();
    renderHook(useClientLinks);
    mockClient.state.calls = [{ state: { callingState } }];
    openURL();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Leave the current call before opening this link',
    );
    expect(mockSetState).not.toHaveBeenCalled();
    expect(deeplinkCallId$.value).toBeUndefined();
  },
);

it.each(['MeetingScreen', 'GuestMeetingScreen'])(
  'blocks an occupied %s even before joining',
  async (route) => {
    await listen();
    renderHook(useClientLinks);
    mockRoute = route;
    openURL();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Leave the current call before opening this link',
    );
    expect(mockSetState).not.toHaveBeenCalled();
    expect(deeplinkCallId$.value).toBeUndefined();
  },
);

it.each([
  'https://pronto.getstream.io/join/call-123',
  'https://getstream.io/video/demos/join/call-123',
  'https://pronto-staging.getstream.io/join/call-123',
  'https://example.com/join/call-123',
])('preserves the saved key for an ordinary link: %s', async (url) => {
  await listen();
  renderHook(useClientLinks);
  openURL(url);
  expect(mockSetState).not.toHaveBeenCalled();
  expect(Alert.alert).not.toHaveBeenCalled();
  expect(deeplinkCallId$.value).toBe('call-123');
});

it.each([
  'https://pronto.getstream.io/join/call-123?encryption_key=',
  'https://pronto.getstream.io/join/call-123?encryption_key',
  'https://pronto.getstream.io/join/call-123?encryption_key=%20%09%20',
  'https://example.com/join/call-123?encryption_key=ignored',
])(
  'rejects an invalid encrypted link on startup and while running: %s',
  async (url) => {
    jest.mocked(Linking.getInitialURL).mockResolvedValue(url);
    await listen();
    expect(deeplinkCallId$.value).toBeUndefined();
    renderHook(useClientLinks);
    expect(mockSetState).not.toHaveBeenCalled();
    expect(deeplinkCallId$.value).toBeUndefined();

    openURL(url);
    expect(mockSetState).not.toHaveBeenCalled();
    expect(deeplinkCallId$.value).toBeUndefined();
  },
);

it('ignores malformed links and removes its listener on unmount', async () => {
  await listen();
  renderHook(useClientLinks);
  openURL('not a URL');
  openURL('https://pronto.getstream.io/join/invalid!id?encryption_key=unused');
  expect(mockSetState).not.toHaveBeenCalled();
  expect(deeplinkCallId$.value).toBeUndefined();
  await cleanupAsync();
  expect(removeListener).toHaveBeenCalledTimes(1);
});
