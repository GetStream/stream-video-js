import clsx from 'clsx';
import { forwardRef } from 'react';
import {
  CallRecordingList,
  IconButton,
  MenuToggle,
  ToggleMenuButtonProps,
  useCallRecordings,
} from '@stream-io/video-react-sdk';

export const CallRecordings = () => {
  const callRecordings = useCallRecordings();

  return (
    <MenuToggle placement="bottom-end" ToggleButton={ToggleMenuButton}>
      <CallRecordingList callRecordings={callRecordings} />
    </MenuToggle>
  );
};

const ToggleMenuButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  ({ menuShown }, ref) => {
    return (
      <IconButton
        className={clsx('str-video__call-recordings__toggle-button', {
          'str-video__call-recordings__toggle-button--active': menuShown,
        })}
        icon="call-recordings"
        ref={ref}
        title={menuShown ? 'Close' : 'Call recordings'}
      />
    );
  },
);
