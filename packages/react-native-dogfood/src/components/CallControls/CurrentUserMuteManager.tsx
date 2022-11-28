import { useEffect } from 'react';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { useMuteState } from '../../hooks/useMuteState';

const CurrentUserMuteManager = () => {
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const username = useAppGlobalStoreValue((store) => store.username);
  const setState = useAppGlobalStoreSetState();
  const { isAudioMuted, isVideoMuted } = useMuteState(
    username,
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
