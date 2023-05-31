import React from 'react';
import { Call } from '@stream-io/video-client';
import {
  CallCycleHandlersType,
  CallCycleLogicsWrapper,
  StreamVideo,
} from '../../src/providers';
import { StreamCallProvider } from '@stream-io/video-react-bindings';
import {
  render as rtlRender,
  RenderOptions,
} from '@testing-library/react-native';
import { RenderResult } from '@testing-library/react-native/build/render';
import { mockClientWithUser } from '../mocks/client';
import { mockCall } from '../mocks/call';

export interface RenderProps {
  component: React.ReactElement<any, string | React.JSXElementConstructor<any>>;

  options?: RenderOptions & {
    call?: Call;
    callCycleHandlers?: CallCycleHandlersType;
  };
}

const mockedCallCycleHandlers = {
  onCallAccepted: jest.fn(),
  onCallEnded: jest.fn(),
  onCallRejected: jest.fn(),
  onCallStarted: jest.fn(),
  onCallTimeout: jest.fn(),
  onCallError: jest.fn(),
};

export * from '@testing-library/react-native';
// override React Testing Library's render with our own
// that way we can wrap the component with the necessary providers
const render = (
  component: RenderProps['component'],
  {
    call,
    callCycleHandlers = mockedCallCycleHandlers,
    ...options
  }: RenderProps['options'] = {},
): RenderResult => {
  const testClient = mockClientWithUser({ id: 'test-user-id' });
  const testCall = call || mockCall(testClient);
  return rtlRender(component, {
    wrapper: ({ children }) => (
      <StreamVideo client={testClient} language={'en'}>
        <StreamCallProvider call={testCall}>
          <CallCycleLogicsWrapper callCycleHandlers={callCycleHandlers}>
            {children}
          </CallCycleLogicsWrapper>
        </StreamCallProvider>
      </StreamVideo>
    ),
    ...options,
  });
};

export { render };
