import { Icon } from '@stream-io/video-react-sdk';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Feedback } from './Feedback';
import clsx from 'clsx';
import Link from 'next/link';

import { Card } from './Card';
import { Badge, LinkBadge, Status } from './Badge';
import { NetworkStatus } from './NetworkStatus';
import { Rating } from './Rating';
import { Header } from './Header';
import { Recordings } from './Recordings';
import {
  useStreamVideoClient,
  useCallStateHooks,
  EdgeResponse,
  useCall,
} from '@stream-io/video-react-sdk';

import { Notification } from './Notification';

export interface EndCallSummaryViewProps {
  rejoin: () => void;
  startNewCall: () => void;
  joinTime?: Date;
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

const toEdgeStatus = (edge: EdgeResponse) => {
  if (edge.green === 1) return 'green';
  if (edge.yellow === 1) return 'yellow';

  return 'red';
};

const toNetworkStatus = (quality: number) => {
  if (quality >= 80) return 'green';
  if (quality >= 40) return 'yellow';

  return 'red';
};

const toNetworkNotification = (
  quality: number,
): {
  message: string;
  type: 'success' | 'info' | 'error' | 'caution';
} => {
  if (quality >= 80)
    return {
      message: 'Your Network is Stable.',
      type: 'success',
    };
  if (quality >= 40)
    return {
      message: 'Your Network is Average.',
      type: 'caution',
    };

  return {
    message: 'Your Network is Poor.',
    type: 'error',
  };
};

export function EndCallSummaryView({
  rejoin,
  startNewCall,
  joinTime,
}: EndCallSummaryViewProps) {
  const [rating, setRating] = useState<{
    current: number;
    maxAmount: number;
    success: boolean;
  }>({ current: 0, maxAmount: 5, success: false });
  const [callStats, setCallStats] = useState<any | undefined>(undefined);
  const [showRecordings, setShowRecordings] = useState(false);
  const [edges, setEdges] = useState<EdgeResponse[] | undefined>(undefined);

  const { useCallStatsReport, useCallStartedAt } = useCallStateHooks();
  const callStatsReport = useCallStatsReport();
  const startedAt = useCallStartedAt();
  const call = useCall();

  const client = useStreamVideoClient();
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

  useEffect(() => {
    if (!client || !call) return;

    async function fetchCallStats() {
      const res = await client?.queryCallStats({
        filter_conditions: {
          call_cid: call?.cid,
        },
        limit: 1,
      });
      return res;
    }

    const response = fetchCallStats();
    response.then((res) => {
      setCallStats(res?.reports[0]);
    });
  }, [client, call]);

  const timeToConnect = useMemo(() => {
    if (!joinTime || !startedAt) return null;
    const timeDifference = startedAt.getTime() - joinTime.getTime();
    const differenceDate = new Date(timeDifference);
    return differenceDate.getMilliseconds();
  }, [joinTime, startedAt]);

  const handleSubmitSuccess = useCallback(() => {
    setRating({ current: 0, maxAmount: 5, success: true });
  }, []);

  const networkNotification = toNetworkNotification(
    callStats?.quality_score || 0,
  );

  return (
    <div className="rd__leave">
      <Header
        rejoin={rejoin}
        startNewCall={startNewCall}
        setShowRecordings={() => setShowRecordings(true)}
      />
      <div className="rd__leave--row rd__leave--row-first">
        <Card
          className="rd__leave--row-quality"
          title="Call Quality"
          tooltip="Combines real-time call quality metrics like latency, packet loss, and jitter to help diagnose and improve video call "
        >
          <Badge
            status={toStatus({
              lowBound: 100,
              highBound: 0,
              value: callStats?.quality_score || 0,
            })}
            variant="large"
          >
            {callStats?.quality_score || 0}%
          </Badge>
        </Card>
        <Card
          className="rd__leave--row-time-to-connect"
          title="Time to connect"
          tooltip="The time it takes to establish a connection after a request."
        >
          <Badge
            status={toStatus({
              lowBound: 1000,
              highBound: 3000,
              value: timeToConnect || 0,
            })}
            variant="large"
          >
            {timeToConnect}ms
          </Badge>
        </Card>
        <Card
          className="rd__leave--row-latency-average"
          title="Latency average"
          tooltip="The time it takes for data to travel between the sender and receiver."
        >
          <Badge
            status={toStatus({
              lowBound: 75,
              highBound: 400,
              value: publisherStats?.averageRoundTripTimeInMs || 0,
            })}
            variant="large"
          >
            {publisherStats?.averageRoundTripTimeInMs || 0}ms
          </Badge>
        </Card>
        <Card
          className="rd__leave--row-video-codex"
          title="Video Codex"
          tooltip="Format used to compress and encode video for efficient storage and playback."
          contentVariant="row"
        >
          <Badge variant="large">
            {publisherStats?.codec?.replace('video/', '') || 'Unknown'}
          </Badge>
        </Card>
      </div>

      <div className="rd__leave--row rd__leave--row-second">
        <Card
          className="rd__leave--row-user-network"
          title="User Network"
          tooltip="The network and device a user is using, often the most common cause of poor audio or video quality."
        >
          <Notification
            message={networkNotification.message}
            variant={networkNotification.type}
          />
          <NetworkStatus
            status={toNetworkStatus(callStats?.quality_score || 0)}
          >
            Network
          </NetworkStatus>
          <NetworkStatus status={'green'}>Device</NetworkStatus>
        </Card>
        <Card
          className="rd__leave--row-rooms"
          title="Video & Audio products"
          link="https://getstream.io/video/"
        >
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
            'rd__leave--review-container rd__leave--row-review',
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
        <Card className="rd__leave--row-edge-networks" variant="parent">
          <Card
            title="Edge networks used"
            tooltip="Displays the quality of the edge network being used for this call."
          >
            <NetworkStatus status={'green'}>
              <Badge variant="small">
                <Icon icon="language" />
                Amsterdam
              </Badge>
            </NetworkStatus>
            <NetworkStatus status={'green'}>
              <Badge variant="small">
                <Icon icon="language" />
                Boston
              </Badge>
            </NetworkStatus>
          </Card>
          <Card
            className="rd__leave--row-edge-servers"
            title="Edge servers available"
            tooltip="Shows available edge servers on Stream’s network that aren’t currently in use."
          >
            <div className="rd__edge-server">
              {edges?.map((edge) => (
                <NetworkStatus key={edge.id} status={toEdgeStatus(edge)}>
                  <Badge variant="small">
                    <Icon icon="language" />
                    <span className="rd__edge-server--country">
                      {toCountryName(edge.country_iso_code)}
                    </span>
                  </Badge>
                </NetworkStatus>
              ))}
            </div>
          </Card>
        </Card>
        <Card
          className="rd__leave---row-sdks"
          title="SDK's"
          link="https://getstream.io/video/"
        >
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
        <Card className="rd__build-and-ship rd__leave--row-build-and-ship">
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
            <Link href="/contact/" className="rd__build-and-ship--button">
              Contact Us
            </Link>
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
            submitSuccess={handleSubmitSuccess}
            rating={rating.current}
            callData={JSON.stringify({ callStats, publisherStats })}
            onClose={() =>
              setRating({ current: 0, maxAmount: 5, success: false })
            }
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
            <Recordings onClose={() => setShowRecordings(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
