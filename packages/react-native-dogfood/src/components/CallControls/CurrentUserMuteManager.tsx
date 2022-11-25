import { useEffect } from 'react';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { useMuteState } from '../../hooks/useMuteState';
import { useObservableValue } from '../../hooks/useObservable';
import { useStore } from '../../hooks/useStore';
import { useStreamVideoStoreValue } from '@stream-io/video-react-native-sdk';

const CurrentUserMuteManager = () => {
  const localMediaStream = useStreamVideoStoreValue(
    (store) => store.localMediaStream,
  );
  const { activeCall$ } = useStore();
  const call = useObservableValue(activeCall$);
  const username = useAppGlobalStoreValue((store) => store.username);
  const setState = useAppGlobalStoreSetState();
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
