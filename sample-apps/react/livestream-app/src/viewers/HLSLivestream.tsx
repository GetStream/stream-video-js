import './HLSLivestream.scss';

import {
  LoadingIndicator,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useEffect, useMemo, useState } from 'react';
import HLS from 'hls.js';
import { ViewerHeader } from './ui/ViewerHeader';
import { ViewerControls } from './ui/ViewerControls';
import { Lobby } from './ui/Lobby';

export const HLSLivestreamUI = () => {
  const { useIsCallHLSBroadcastingInProgress, useCallEgress, useIsCallLive } =
    useCallStateHooks();
  const isBroadcasting = useIsCallHLSBroadcastingInProgress();
  const isLive = useIsCallLive();
  const egress = useCallEgress();
  const hls = useMemo(() => new HLS(), []);

  const [autoJoin, setAutoJoin] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hlsStreamEnded, setHlsStreamEnded] = useState(false);
  const playlist_url = egress?.hls?.playlist_url;
  useEffect(() => {
    if (!videoRef || !playlist_url) return;

    let timeoutId: NodeJS.Timeout;
    if (autoJoin && isBroadcasting) {
      hls.on(HLS.Events.ERROR, (e, data) => {
        console.error('HLS error, attempting to recover', e, data);

        setIsPlaying(false);
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          hls.loadSource(playlist_url);
        }, 1000);
      });
      hls.on(HLS.Events.LEVELS_UPDATED, (e, data) => {
        console.error('HLS levels updated', e, data);
      });
      hls.on(HLS.Events.BUFFER_EOS, (e, data) => {
        console.error('HLS buffer eos', e, data);
        setHlsStreamEnded(true);
      });
      hls.loadSource(playlist_url);
      hls.attachMedia(videoRef);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [autoJoin, hls, isBroadcasting, videoRef, playlist_url]);

  useEffect(() => {
    if (!videoRef) return;
    const handleOnPlay = () => setIsPlaying(true);
    videoRef.addEventListener('play', handleOnPlay);
    return () => {
      videoRef.removeEventListener('play', handleOnPlay);
    };
  }, [videoRef]);

  if (!hlsStreamEnded && (!isLive || !autoJoin)) {
    return (
      <Lobby
        autoJoin={autoJoin}
        isStreaming={isLive}
        setAutoJoin={setAutoJoin}
      />
    );
  }

  return (
    <>
      <ViewerHeader hls={hls} />
      {!isPlaying && (
        <LoadingIndicator className="loading-indicator" text="Buffering..." />
      )}
      <div className="video-player-container--wrapper">
        <div className="video-player-container">
          {hlsStreamEnded && (
            <div className="hls-stream-ended">The HLS stream has ended.</div>
          )}
          <video
            className="hls-video-player"
            autoPlay
            playsInline
            ref={setVideoRef}
          />
        </div>
      </div>
      <ViewerControls />
    </>
  );
};
