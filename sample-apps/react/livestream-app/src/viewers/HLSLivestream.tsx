import './HLSLivestream.scss';

import {
  LoadingIndicator,
  useCallMetadata,
  useIsCallBroadcastingInProgress,
} from '@stream-io/video-react-sdk';
import { useEffect, useMemo, useState } from 'react';
import HLS from 'hls.js';
import { ViewerHeader } from './ui/ViewerHeader';
import { ViewerControls } from './ui/ViewerControls';
import { Button, Checkbox, FormControlLabel, Typography } from '@mui/material';

export const HLSLivestreamUI = () => {
  const isBroadcasting = useIsCallBroadcastingInProgress();
  const metadata = useCallMetadata();
  const hls = useMemo(() => new HLS(), []);

  const [autoJoin, setAutoJoin] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => {
    if (!videoRef) return;
    let timeoutId: NodeJS.Timeout;
    if (autoJoin && isBroadcasting && metadata && metadata.egress.hls) {
      const { playlist_url } = metadata.egress.hls;
      hls.on(HLS.Events.ERROR, (e, data) => {
        console.error('HLS error, attempting to recover', e, data);

        setIsPlaying(false);
        timeoutId = setTimeout(() => {
          hls.loadSource(playlist_url);
        }, 1000);
      });
      hls.on(HLS.Events.LEVELS_UPDATED, (e, data) => {
        console.error('HLS levels updated', e, data);
      });
      hls.loadSource(playlist_url);
      hls.attachMedia(videoRef);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [autoJoin, hls, isBroadcasting, metadata, videoRef]);

  useEffect(() => {
    if (!videoRef) return;
    const handleOnPlay = () => setIsPlaying(true);
    videoRef.addEventListener('play', handleOnPlay);
    return () => {
      videoRef.removeEventListener('play', handleOnPlay);
    };
  }, [videoRef]);

  if (!isBroadcasting || !autoJoin) {
    return (
      <div>
        <Typography variant="h4">
          <LoadingIndicator
            className="loading-indicator"
            text={
              isBroadcasting
                ? 'Stream is ready!'
                : 'Waiting for the livestream to start'
            }
          />
        </Typography>
        <div className="auto-join-container">
          <FormControlLabel
            control={
              <Checkbox
                checked={autoJoin}
                onChange={(e) => setAutoJoin(e.target.checked)}
              />
            }
            label="Auto Join"
          />
          <Button
            variant="contained"
            disabled={!isBroadcasting}
            onClick={() => {
              setAutoJoin(true);
            }}
          >
            Join Stream
          </Button>
        </div>
      </div>
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
