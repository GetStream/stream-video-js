import { useCallback, useEffect, useRef, useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { CompositeButton } from '../Button';
import { Icon } from '../Icon';

/**
 * SpeakerTest component that plays a test audio through the selected speaker.
 * This allows users to verify their audio output device is working correctly.
 */
export const SpeakerTest = (props: { audioUrl?: string }) => {
  const { useSpeakerState } = useCallStateHooks();
  const { selectedDevice } = useSpeakerState();
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const {
    audioUrl = `https://unpkg.com/${process.env.PKG_NAME}@${process.env.PKG_VERSION}/assets/piano.mp3`,
  } = props;

  // Update audio output device when selection changes
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio || !selectedDevice) return;

    // Set the sinkId to route audio to the selected speaker
    if ('setSinkId' in audio) {
      audio.setSinkId(selectedDevice).catch((err) => {
        console.error('Failed to set audio output device:', err);
      });
    }
  }, [selectedDevice]);

  const handlePlayTest = useCallback(async () => {
    const audio = audioElementRef.current;
    if (!audio) return;

    audio.src = audioUrl;

    try {
      if (isPlaying) {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Failed to play test audio:', err);
      setIsPlaying(false);
    }
  }, [isPlaying, audioUrl]);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return (
    <div className="str-video__speaker-test">
      <audio
        ref={audioElementRef}
        onEnded={handleAudioEnded}
        onPause={() => setIsPlaying(false)}
      />
      <CompositeButton
        className="str-video__speaker-test__button"
        onClick={handlePlayTest}
        type="button"
      >
        <div className="str-video__speaker-test__button-content">
          <Icon icon="speaker" />
          {isPlaying ? 'Stop Test' : 'Test Speaker'}
        </div>
      </CompositeButton>
    </div>
  );
};
