import {
  defaultReactions,
  useCall,
  useToggleAudioMuteState,
  useToggleVideoMuteState,
} from '@stream-io/video-react-sdk';
import { useEffect } from 'react';

import hotkeys from 'hotkeys-js';

enum Hotkeys {
  TOGGLE_AUDIO_MAC = 'cmd+d',
  TOGGLE_AUDIO_OTHER = 'ctrl+d',
  TOGGLE_VIDEO_MAC = 'cmd+e',
  TOGGLE_VIDEO_OTHER = 'ctrl+e',
  RAISE_HAND_MAC = 'ctrl+cmd+h',
  RAISE_HAND_OTHER = 'ctrl+alt+h',
}

const isMacOS = () => {
  return !!navigator.userAgent.match(/(Mac\s?OS)/g)?.length;
};

const [, raiseHandReaction] = defaultReactions;

export const useKeyboardShortcuts = () => {
  const { toggleAudioMuteState } = useToggleAudioMuteState();
  const { toggleVideoMuteState } = useToggleVideoMuteState();
  const call = useCall();

  useEffect(() => {
    const key = `${Hotkeys.TOGGLE_AUDIO_MAC},${Hotkeys.TOGGLE_AUDIO_OTHER}`;
    const isMac = isMacOS();

    hotkeys(key, (e, ke) => {
      e.preventDefault();

      if (isMac && ke.shortcut !== Hotkeys.TOGGLE_AUDIO_MAC) return;

      toggleAudioMuteState();
    });

    return () => {
      hotkeys.unbind(key);
    };
  }, [toggleAudioMuteState]);

  useEffect(() => {
    const key = `${Hotkeys.TOGGLE_VIDEO_MAC},${Hotkeys.TOGGLE_AUDIO_OTHER}`;
    const isMac = isMacOS();

    hotkeys(key, (e, ke) => {
      e.preventDefault();

      if (isMac && ke.shortcut !== Hotkeys.TOGGLE_VIDEO_MAC) return;

      toggleVideoMuteState();
    });

    return () => {
      hotkeys.unbind(key);
    };
  }, [toggleVideoMuteState]);

  useEffect(() => {
    const key = `${Hotkeys.RAISE_HAND_MAC},${Hotkeys.RAISE_HAND_OTHER}`;
    const isMac = isMacOS();

    if (!call) return;

    hotkeys(key, (e, ke) => {
      e.preventDefault();

      if (isMac && ke.shortcut !== Hotkeys.RAISE_HAND_MAC) return;

      call.sendReaction(raiseHandReaction);
    });

    return () => {
      hotkeys.unbind(key);
    };
  }, [call]);
};
