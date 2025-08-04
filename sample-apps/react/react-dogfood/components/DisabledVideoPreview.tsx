import {
  DefaultVideoPlaceholder,
  StreamVideoParticipant,
} from '@stream-io/video-react-sdk';
import { useSession } from 'next-auth/react';

export const DisabledVideoPreview = () => {
  const { data: session } = useSession();

  return (
    <DefaultVideoPlaceholder
      participant={
        {
          userId: session?.user?.streamUserId,
          name: session?.user?.name,
          image: session?.user?.image,
        } as StreamVideoParticipant
      }
    />
  );
};
