import React from 'react';
import { render, screen } from '../utils/RNTLTools';
import mockParticipant from '../mocks/participant';
import { ComponentTestIds, ImageTestIds } from '../../src/constants/TestIds';
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

    expect(await screen.findByTestId(ImageTestIds.AVATAR)).toBeOnTheScreen();
    expect(() => screen.getByText('TT')).toThrow(
      /unable to find an element with text: TT/i,
    );
  });

  it('should apply the size prop to the avatar', async () => {
    const testParticipant = mockParticipant();
    const size = 200;
    render(<Avatar participant={testParticipant} size={size} />);
    expect(
      await screen.findByTestId(ComponentTestIds.PARTICIPANT_AVATAR),
    ).toHaveStyle({
      borderRadius: size / 2,
      height: size,
      width: size,
    });
  });
});
