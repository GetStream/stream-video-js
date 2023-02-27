import { VideoPlaceholder } from '@stream-io/video-react-sdk';
import { useSession } from 'next-auth/react';

export const DisabledVideoPreview = () => {
  const { data: session } = useSession();

  return <VideoPlaceholder name={session?.user?.name} />;
};
