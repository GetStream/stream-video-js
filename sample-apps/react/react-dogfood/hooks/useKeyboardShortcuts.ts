import {
  defaultReactions,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useEffect, useRef, useState } from 'react';

import hotkeys from 'hotkeys-js';

enum KeyboardShortcut {
  PUSH_TO_TALK = 'space',
  TOGGLE_AUDIO_MAC = 'cmd+d,cmd+shift+space',
  TOGGLE_AUDIO_OTHER = 'ctrl+d,ctrl+shift+space',
  TOGGLE_VIDEO_MAC = 'cmd+e',
  TOGGLE_VIDEO_OTHER = 'ctrl+e',
  RAISE_HAND_MAC = 'ctrl+cmd+h',
  RAISE_HAND_OTHER = 'ctrl+alt+h',
}

const isMacOS = () => {
  return !!navigator.userAgent.match(/(Mac\s?OS)/g)?.length;
};

const [, raiseHandReaction] = defaultReactions;

export const usePushToTalk = (key: string) => {
  const { useMicrophoneState } = useCallStateHooks();
  const { microphone, isMute } = useMicrophoneState();
  const hotkeyHandlerRef = useRef<(e: KeyboardEvent) => void>();
  const enableMicWithPushToTalkPromiseRef = useRef<Promise<void> | null>(null);

  hotkeyHandlerRef.current = (e) => {
    if (e.metaKey || e.ctrlKey) {
      return;
    }

    e.preventDefault();

    if (e.type === 'keydown' && isMute) {
      enableMicWithPushToTalkPromiseRef.current = microphone
        .enable()
        .catch(console.error);
    }

    if (e.type === 'keyup' && enableMicWithPushToTalkPromiseRef.current) {
      enableMicWithPushToTalkPromiseRef.current
        .then(() => microphone.disable())
        .catch(console.error);
      enableMicWithPushToTalkPromiseRef.current = null;
    }
  };

  useEffect(() => {
    hotkeys(key, { keyup: true }, (e) => {
      hotkeyHandlerRef.current?.(e);
    });

    return () => {
      hotkeys.unbind(key);
    };
  }, [key]);
};

export const useKeyboardShortcuts = () => {
  const call = useCall();
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { microphone } = useMicrophoneState();
  const { camera } = useCameraState();
  usePushToTalk(KeyboardShortcut.PUSH_TO_TALK);

  useEffect(() => {
    const key = `${KeyboardShortcut.TOGGLE_AUDIO_MAC},${KeyboardShortcut.TOGGLE_AUDIO_OTHER}`;
    const isMac = isMacOS();

    hotkeys(key, (e, ke) => {
      e.preventDefault();

      if (isMac && !KeyboardShortcut.TOGGLE_AUDIO_MAC.includes(ke.shortcut))
        return;

      microphone.toggle().catch(console.error);
    });

    return () => {
      hotkeys.unbind(key);
    };
  }, [microphone]);

  useEffect(() => {
    const key = `${KeyboardShortcut.TOGGLE_VIDEO_MAC},${KeyboardShortcut.TOGGLE_VIDEO_OTHER}`;
    const isMac = isMacOS();

    hotkeys(key, (e, ke) => {
      e.preventDefault();

      if (isMac && !KeyboardShortcut.TOGGLE_VIDEO_MAC.includes(ke.shortcut))
        return;

      camera.toggle().catch(console.error);
    });

    return () => {
      hotkeys.unbind(key);
    };
  }, [camera]);

  useEffect(() => {
    const key = `${KeyboardShortcut.RAISE_HAND_MAC},${KeyboardShortcut.RAISE_HAND_OTHER}`;
    const isMac = isMacOS();

    if (!call) return;

    hotkeys(key, (e, ke) => {
      e.preventDefault();

      if (isMac && !KeyboardShortcut.RAISE_HAND_MAC.includes(ke.shortcut))
        return;

      call.sendReaction(raiseHandReaction).catch(console.error);
    });

    return () => {
      hotkeys.unbind(key);
    };
  }, [call]);
};
