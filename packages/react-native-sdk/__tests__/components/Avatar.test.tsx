import React from 'react';
import { render, screen } from '../utils/RNTLTools';
import mockParticipant from '../mocks/participant';
import { ComponentTestIds, ImageTestIds } from '../../src/constants/TestIds';
import { Avatar } from '../../src/components/utility/Avatar';
import { defaultTheme } from '../../src/theme/theme';

describe('Avatar', () => {
  it('should render initials of participant when imageUrl is not specified', async () => {
    const testParticipant = mockParticipant({ image: undefined });
    render(<Avatar user={testParticipant} />);

    expect(await screen.findByText('TT')).toBeOnTheScreen();
  });

  it('should render image of participant when imageUrl is specified', async () => {
    const testParticipant = mockParticipant();

    render(<Avatar user={testParticipant} />);

    expect(await screen.findByTestId(ImageTestIds.AVATAR)).toBeOnTheScreen();
    expect(() => screen.getByText('TT')).toThrow(
      /unable to find an element with text: TT/i,
    );
  });

  /**
   * `user` takes either identifier spelling: participants carry `userId`, the
   * coordinator user models carry `id`. Both have to reach the same output.
   */
  it('should render initials of a coordinator user, which identifies by id', async () => {
    render(<Avatar user={{ id: '123-456', name: 'Testy van der Test' }} />);

    expect(await screen.findByText('TT')).toBeOnTheScreen();
  });

  it('should fall back to the identifier when the user has no name', async () => {
    render(<Avatar user={{ id: 'Quinn', image: undefined }} />);

    expect(await screen.findByText('Q')).toBeOnTheScreen();
  });

  it('should apply the size prop to the avatar', async () => {
    const testParticipant = mockParticipant();
    const size = 'xl';

    render(<Avatar user={testParticipant} size={size} />);

    // read from the theme rather than hardcoded: the avatar sizes are token
    // derived, so a token change should not have to be mirrored here
    expect(
      await screen.findByTestId(ComponentTestIds.PARTICIPANT_AVATAR),
    ).toHaveStyle(defaultTheme.avatar.container[size]);
  });
});
