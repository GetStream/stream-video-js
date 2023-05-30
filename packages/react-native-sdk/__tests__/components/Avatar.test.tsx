import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Avatar } from '../../src/components/Avatar';
import mockParticipant from '../mocks/participant';
import { A11yComponents } from '../../src/constants/A11yLabels';

describe('Avatar', () => {
  it('should render initials of participant when imageUrl is not specified', () => {
    const testParticipant = mockParticipant({ image: undefined });
    render(<Avatar participant={testParticipant} />);

    expect(screen.getByText('TT')).toBeOnTheScreen();
  });

  it('should render image of participant when imageUrl is not specified', () => {
    const testParticipant = mockParticipant();

    render(<Avatar participant={testParticipant} />);
    expect(() => screen.getByText('TT')).toThrow(
      /unable to find an element with text: TT/i,
    );
  });

  it('should apply the radius prop to the avatar', () => {
    const testParticipant = mockParticipant();
    const radius = 200;
    render(<Avatar participant={testParticipant} radius={radius} />);
    expect(
      screen.getByLabelText(A11yComponents.PARTICIPANT_AVATAR),
    ).toHaveStyle({
      borderRadius: radius / 2,
      height: radius,
      width: radius,
    });
  });
});
