import React from 'react';
import { render, screen } from '../utils/RNTLTools';
import mockParticipant from '../mocks/participant';
import { A11yComponents, A11yImages } from '../../src/constants/A11yLabels';
import { Avatar } from '../../src/components/utility/Avatar';

describe('Avatar', () => {
  it('should render initials of participant when imageUrl is not specified', async () => {
    const testParticipant = mockParticipant({ image: undefined });
    render(<Avatar participant={testParticipant} />);

    expect(await screen.findByText('TT')).toBeOnTheScreen();
  });

  it('should render image of participant when imageUrl is not specified', async () => {
    const testParticipant = mockParticipant();

    render(<Avatar participant={testParticipant} />);

    expect(await screen.findByLabelText(A11yImages.AVATAR)).toBeOnTheScreen();
    expect(() => screen.getByText('TT')).toThrow(
      /unable to find an element with text: TT/i,
    );
  });

  it('should apply the radius prop to the avatar', async () => {
    const testParticipant = mockParticipant();
    const radius = 200;
    render(<Avatar participant={testParticipant} radius={radius} />);
    expect(
      await screen.findByLabelText(A11yComponents.PARTICIPANT_AVATAR),
    ).toHaveStyle({
      borderRadius: radius / 2,
      height: radius,
      width: radius,
    });
  });
});
