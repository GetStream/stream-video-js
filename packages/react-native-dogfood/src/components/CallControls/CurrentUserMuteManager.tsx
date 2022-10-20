import { useEffect } from 'react';
import { useAppGlobalStore } from '../../contexts/AppContext';
import { useMuteState } from '../../hooks/useMuteState';

const CurrentUserMuteManager = () => {
  const [{ call, localMediaStream, username }, setState] = useAppGlobalStore(
    (store) => ({
      call: store.call,
      localMediaStream: store.localMediaStream,
      isAudioMuted: store.isAudioMuted,
      isVideoMuted: store.isVideoMuted,
      username: store.username,
    }),
  );
  const { isAudioMuted, isVideoMuted } = useMuteState(
    username,
    call,
    localMediaStream,
  );
  useEffect(() => {
    setState({
      isAudioMuted,
      isVideoMuted,
    });
  }, [isAudioMuted, isVideoMuted, setState]);

  return null;
};

export default CurrentUserMuteManager;
