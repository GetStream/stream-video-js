import React, { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import mockParticipant from '../mocks/participant';
import { ParticipantView } from '../../src/components/ParticipantView';
import { StreamVideo } from '../../src/providers';
import { mockClientWithUser } from '../mocks/client';

console.warn = jest.fn();
const Wrapper: ({ children }: { children: ReactNode }) => JSX.Element = ({
  children,
}) => {
  const testClient = mockClientWithUser({ id: 'test-user-id' });
  return <StreamVideo client={testClient}>{children}</StreamVideo>;
};
describe('ParticipantView', () => {
  it('should render correctly', async () => {
    const testParticipant = mockParticipant({ image: undefined });
    render(
      <ParticipantView
        participant={testParticipant}
        kind={'video'}
        isVisible={false}
      />,
      {
        wrapper: Wrapper,
      },
    );

    expect(
      await screen.findByLabelText('participant-avatar'),
    ).toBeOnTheScreen();
  });
});
