import {
  DefaultVideoPlaceholder,
  StreamVideoParticipant,
} from '@stream-io/video-react-sdk';
import { useSession } from 'next-auth/react';

export const DisabledVideoPreview = () => {
  const { data: session } = useSession();

  return (
    <DefaultVideoPlaceholder
      participant={session?.user as StreamVideoParticipant}
    />
  );
};
