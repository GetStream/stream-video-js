import React, { PropsWithChildren } from 'react';
import { Call, StreamVideoClient } from '@stream-io/video-client';
import { StreamVideo } from '../../src/providers';
import { StreamCallProvider } from '@stream-io/video-react-bindings';
import {
  render as rtlRender,
  RenderOptions,
} from '@testing-library/react-native';
import { RenderResult } from '@testing-library/react-native/build/render';
import { mockClientWithUser } from '../mocks/client';
import { mockCall } from '../mocks/call';
import { MediaStreamManagement } from '../../src/providers/MediaStreamManagement';

export interface RenderProps {
  component: React.ReactElement<any, string | React.JSXElementConstructor<any>>;

  options?: RenderOptions & {
    call?: Call;
  };
}

interface WrapperProps {
  client: StreamVideoClient;
  call: Call;
}

export * from '@testing-library/react-native';

const Wrapper = ({
  children,
  client,
  call,
}: PropsWithChildren<WrapperProps>) => (
  <StreamVideo client={client} language={'en'}>
    <StreamCallProvider call={call}>
      <MediaStreamManagement>{children}</MediaStreamManagement>
    </StreamCallProvider>
  </StreamVideo>
);
// override React Testing Library's render with our own
// that way we can wrap the component with the necessary providers
const render = (
  component: RenderProps['component'],
  { call, ...options }: RenderProps['options'] = {},
): RenderResult => {
  const testClient = mockClientWithUser({ id: 'test-user-id' });
  const testCall = call || mockCall(testClient);
  return rtlRender(component, {
    wrapper: (props) => (
      <Wrapper {...props} client={testClient} call={testCall} />
    ),
    ...options,
  });
};

export { render };
