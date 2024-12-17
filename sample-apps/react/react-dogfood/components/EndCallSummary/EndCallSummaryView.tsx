import { Icon } from '@stream-io/video-react-sdk';
import { useState, useCallback, useEffect } from 'react';
import { Feedback } from '../Feedback/Feedback';
import clsx from 'clsx';

import { Card } from './Card';
import { Badge, LinkBadge, Status } from './Badge';
import { NetworkStatus } from './NetworkStatus';
import { Rating } from './Rating';
import { Header } from './Header';
import {
  useStreamVideoClient,
  useCall,
  useCallStateHooks,
  EdgeResponse,
} from '@stream-io/video-react-sdk';
import { Notification } from './Notification';
import { CallRecordings } from '../CallRecordings';

export interface EndCallSummaryViewProps {
  rejoin: () => void;
  startNewCall: () => void;
}

const toStatus = (config: {
  value: number;
  lowBound: number;
  highBound: number;
}): Status => {
  const { value, lowBound, highBound } = config;
  if (value <= lowBound) return Status.GOOD;
  if (value >= lowBound && value <= highBound) return Status.AVERAGE;
  if (value >= highBound) return Status.BAD;
  return Status.GOOD;
};

const toCountryName = (isoCountryCode: string) => {
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
  return regionNames.of(isoCountryCode);
};

export function EndCallSummaryView({
  rejoin,
  startNewCall,
}: EndCallSummaryViewProps) {
  const [rating, setRating] = useState<{
    current: number;
    maxAmount: number;
    success: boolean;
  }>({ current: 0, maxAmount: 5, success: false });
  const [showRecordings, setShowRecordings] = useState(false);
  const [edges, setEdges] = useState<EdgeResponse[] | undefined>(undefined);
  const client = useStreamVideoClient();
  const call = useCall();

  const { useCallStatsReport } = useCallStateHooks();
  const callStatsReport = useCallStatsReport();

  const { publisherStats } = callStatsReport || {};

  const handleSetRating = useCallback(
    (value: { current: number; maxAmount: number }) => {
      setRating((currentRating) => ({
        ...currentRating,
        current: value.current,
      }));
    },
    [],
  );

  useEffect(() => {
    if (!client) return;
    client.edges().then((response) => {
      setEdges(response.edges);
    });
  }, [client]);

  const latencyComparison = {
    lowBound: 75,
    highBound: 400,
  };

  const handleSubmitSuccess = useCallback(() => {
    setRating({ current: 0, maxAmount: 5, success: true });
  }, []);

  return (
    <div className="rd__leave">
      <Header
        rejoin={rejoin}
        startNewCall={startNewCall}
        setShowRecordings={() => setShowRecordings(true)}
      />
      <div className="rd__leave--row rd__leave--row-first">
        <Card
          title="Call Quality"
          tooltip="Combines real-time call quality metrics like latency, packet loss, and jitter to help diagnose and improve video call "
        >
          <Badge
            status={toStatus({
              ...latencyComparison,
              value: publisherStats?.averageJitterInMs || 0,
            })}
            variant="large"
          >
            {publisherStats?.averageJitterInMs || 0}ms
          </Badge>
        </Card>
        <Card
          title="Time to connect"
          tooltip="The time it takes to establish a connection after a request."
        >
          <Badge
            status={toStatus({
              lowBound: 0.5,
              highBound: 30,
              value: 0.4,
            })}
            variant="large"
          >
            0.4s
          </Badge>
        </Card>
        <Card
          title="Latency average"
          tooltip="The time it takes for data to travel between the sender and receiver."
        >
          <Badge
            status={toStatus({
              ...latencyComparison,
              value: publisherStats?.averageRoundTripTimeInMs || 0,
            })}
            variant="large"
          >
            {publisherStats?.averageRoundTripTimeInMs || 0}ms
          </Badge>
        </Card>
        <Card
          title="Video Codex"
          tooltip="Format used to compress and encode video for efficient storage and playback."
          contentVariant="row"
        >
          <Badge variant="large">{publisherStats?.codec || 'Unknown'}</Badge>
        </Card>
      </div>

      <div className="rd__leave--row rd__leave--row-second">
        <Card
          title="User Network"
          tooltip="The network and device a user is using, often the most common cause of poor audio or video quality."
        >
          <Notification message="Your Network is Stable." variant="success" />
          <NetworkStatus status={80}>Network</NetworkStatus>
          <NetworkStatus status={20}>Device</NetworkStatus>
        </Card>
        <Card title="Video & Audio products" link="https://getstream.io/video/">
          <div className="rd__leave--rooms">
            <LinkBadge
              className="rd__leave--rooms-link"
              variant="small"
              fit="fill"
              link="https://getstream.io/video/video-calling/"
            >
              <Icon icon="camera" />
              Video Calling
            </LinkBadge>
            <LinkBadge
              className="rd__leave--rooms-link"
              variant="small"
              fit="fill"
              link="https://getstream.io/video/livestreaming/"
            >
              <Icon icon="layout-speaker-live-stream" />
              Live Stream
            </LinkBadge>
            <LinkBadge
              className="rd__leave--rooms-link"
              variant="small"
              fit="fill"
              link="https://getstream.io/video/voice-calling/"
            >
              <Icon icon="mic" />
              Audio Calling
            </LinkBadge>
            <LinkBadge
              className="rd__leave--rooms-link"
              variant="small"
              fit="fill"
              link="https://getstream.io/video/audio-rooms/"
            >
              <Icon icon="speaker" />
              Audio Rooms
            </LinkBadge>
          </div>
        </Card>
        <Card
          className={clsx(
            'rd__leave--review-container',
            rating.success && 'rd__leave--review-container-success',
          )}
        >
          <div
            className={clsx(
              'rd__leave--review',
              rating.success && 'rd__leave--review-success',
            )}
          >
            <h2
              className={clsx(
                'rd__leave--review-title',
                rating.success && 'rd__leave--review-title-success',
              )}
            >
              {rating.success
                ? 'Thank you for your feedback!'
                : 'How Was your Call Experience?'}
            </h2>
            {rating.success ? null : (
              <Rating rating={rating} handleSetRating={handleSetRating} />
            )}
          </div>
        </Card>
      </div>

      <div className="rd__leave--row rd__leave--row-third">
        <Card variant="parent">
          <Card
            title="Edge networks used"
            tooltip="Displays the quality of the edge network being used for this call."
          >
            <NetworkStatus status={80}>
              <Badge variant="small">
                <Icon icon="language" />
                Amsterdam
              </Badge>
            </NetworkStatus>
            <NetworkStatus status={100}>
              <Badge variant="small">
                <Icon icon="language" />
                Boston
              </Badge>
            </NetworkStatus>
          </Card>
          <Card
            title="Edge servers available"
            tooltip="Shows available edge servers on Stream’s network that aren’t currently in use."
          >
            <div className="rd__edge-server">
              {edges?.map((edge) => (
                <NetworkStatus status={90}>
                  <Badge variant="small">
                    <Icon icon="language" />
                    {toCountryName(edge.country_iso_code)}
                  </Badge>
                </NetworkStatus>
              ))}
            </div>
          </Card>
        </Card>
        <Card title="SDK's" link="https://getstream.io/video/">
          <div className="rd__sdks">
            <LinkBadge
              className="rd__sdks--link"
              link="https://getstream.io/video/sdk/react/"
            >
              <div className="rd__sdks--link-icon">
                <Icon icon="react" />
              </div>
            </LinkBadge>
            <LinkBadge
              className="rd__sdks--link"
              link="https://getstream.io/video/sdk/ios/"
            >
              <div className="rd__sdks--link-icon">
                <Icon icon="swift" />
              </div>
            </LinkBadge>
            <LinkBadge
              className="rd__sdks--link"
              link="https://getstream.io/video/sdk/javascript/"
            >
              <div className="rd__sdks--link-icon">
                <Icon icon="javascript" />
              </div>
            </LinkBadge>
            <LinkBadge
              className="rd__sdks--link"
              link="https://getstream.io/video/sdk/flutter/"
            >
              <div className="rd__sdks--link-icon">
                <Icon icon="flutter" />
              </div>
            </LinkBadge>
            <LinkBadge
              className="rd__sdks--link"
              link="https://getstream.io/video/sdk/android/"
            >
              <div className="rd__sdks--link-icon">
                <Icon icon="android" />
              </div>
            </LinkBadge>
            <LinkBadge
              className="rd__sdks--link"
              link="https://getstream.io/video/sdk/unity/"
            >
              <div className="rd__sdks--link-icon">
                <Icon icon="unity" />
              </div>
            </LinkBadge>
          </div>
        </Card>
        <Card className="rd__build-and-ship">
          <div className="rd__build-and-ship--content">
            <div className="rd__build-and-ship--content-text">
              <h2 className="rd__build-and-ship--title">
                Build and Ship With Confidence
              </h2>
              <p className="rd__build-and-ship--description">
                Join industry leaders who trust Stream’s SDKs to power
                connections for billions of users.
              </p>
            </div>
          </div>
          <div className="rd__build-and-ship--button-container">
            <button className="rd__build-and-ship--button">Contact Us</button>
          </div>
        </Card>
      </div>
      {rating.current !== 0 && rating.current < 3 && (
        <div className="rd__modal">
          <div
            className="rd__modal--background"
            onClick={() =>
              setRating({ current: 0, maxAmount: 5, success: false })
            }
          />
          <Feedback
            className="rd__modal--content"
            // submitSuccess={handleSubmitSuccess}
          />
        </div>
      )}
      {showRecordings && (
        <div className="rd__modal">
          <div
            className="rd__modal--background"
            onClick={() => setShowRecordings(false)}
          />
          <div className="rd__modal--content">
            <CallRecordings />
          </div>
        </div>
      )}
    </div>
  );
}
