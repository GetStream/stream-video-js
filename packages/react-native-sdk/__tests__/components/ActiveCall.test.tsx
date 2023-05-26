import React, { ReactNode } from 'react';
import mockParticipant from '../mocks/participant';
import { ParticipantView } from '../../src/components/ParticipantView';
import { StreamCall, StreamVideo } from '../../src/providers';
import { mockClientWithUser } from '../mocks/client';

console.warn = jest.fn();
jest.useFakeTimers();

const Wrapper: ({ children }: { children: ReactNode }) => JSX.Element = ({
  children,
}) => {
  const testClient = mockClientWithUser({ id: 'test-user-id' });
  const callId = 'test-call-id';
  return (
    <StreamVideo client={testClient}>
      <StreamCall callId={callId}>{children}</StreamCall>
    </StreamVideo>
  );
};
describe('ParticipantView', () => {
  it('should render participant`s avatar when set to not visible, label, user name and reaction', async () => {
    const testParticipant = mockParticipant({
      image: undefined,
      publishedTracks: [],
      reaction: {
        type: 'reaction',
        emoji_code: ':fireworks:',
      },
    });
    //TODO: test ActiveCall
  });
});
