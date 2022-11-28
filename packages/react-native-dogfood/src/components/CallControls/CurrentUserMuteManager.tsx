import { useEffect } from 'react';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { useMuteState } from '../../hooks/useMuteState';
import { useStreamVideoStoreValue } from '@stream-io/video-react-native-sdk';

const CurrentUserMuteManager = () => {
  const localMediaStream = useStreamVideoStoreValue(
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
    });
  }, [isAudioMuted, isVideoMuted, setState]);

  return null;
};

export default CurrentUserMuteManager;
