import {
  StreamVideoParticipant,
  VideoPlaceholder,
} from '@stream-io/video-react-sdk';
import { useSession } from 'next-auth/react';

export const DisabledVideoPreview = () => {
  const { data: session } = useSession();

  return (
    <VideoPlaceholder participant={session?.user as StreamVideoParticipant} />
  );
};
