import { Icon, useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { decodeBase64 } from 'stream-chat';
import { getConnectionString } from '../lib/connectionString';

export const DevMenu = () => {
  const call = useCall();
  return (
    <ul className="rd__dev-menu">
      <li className="rd__dev-menu__item">
        <RestartPublisher />
      </li>
      <li className="rd__dev-menu__item">
        <RestartSubscriber />
      </li>

      <li className="rd__dev-menu__item rd__dev-menu__item--divider" />

      <li className="rd__dev-menu__item">
        <ConnectToLocalSfu sfuId="SFU-1" port={3031} />
      </li>
      <li className="rd__dev-menu__item">
        <ConnectToLocalSfu sfuId="SFU-2" port={3033} />
      </li>
      <li className="rd__dev-menu__item">
        <ConnectToLocalSfu sfuId="SFU-3" port={3036} />
      </li>

      <li className="rd__dev-menu__item">
        <SfuCallStats />
      </li>
      <li className="rd__dev-menu__item">
        <TraceStats />
      </li>

      <li className="rd__dev-menu__item rd__dev-menu__item--divider" />

      <li className="rd__dev-menu__item">
        <LogPublisherStats />
      </li>
      <li className="rd__dev-menu__item">
        <LogSubscriberStats />
      </li>
      <li className="rd__dev-menu__item rd__dev-menu__item--divider" />

      <li className="rd__dev-menu__item">
        <StartStopBroadcasting />
      </li>
      <li className="rd__dev-menu__item">
        <GoOrStopLive />
      </li>
      <li className="rd__dev-menu__item rd__dev-menu__item--divider" />
      <li className="rd__dev-menu__item">
        <a
          className="rd__link rd__link--faux-button rd__link--align-left"
          href="https://www.notion.so/stream-wiki/Usage-guide-and-known-limitations-603b12af2dff43d69119be4dae462b19"
          target="_blank"
          rel="noreferrer"
        >
          <Icon className="rd__link__icon" icon="info-document" />
          Usage guide
        </a>
      </li>
      <li className="rd__dev-menu__item">
        <a
          className="rd__link rd__link--faux-button rd__link--align-left"
          href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/call-recordings`}
          target="_blank"
          rel="noreferrer"
        >
          <Icon className="rd__link__icon" icon="film-roll" />
          Recordings
        </a>
      </li>

      <li className="rd__dev-menu__item rd__dev-menu__item--divider" />
      <a
        className="rd__link rd__link--faux-button rd__link--align-left"
        href={`https://pronto-staging.getstream.io/join/${call?.id}?type=${call?.type}`}
        rel="noreferrer"
      >
        Switch to Pronto Staging
      </a>
      <a
        className="rd__link rd__link--faux-button rd__link--align-left"
        href={`https://pronto.getstream.io/join/${call?.id}?type=${call?.type}`}
        rel="noreferrer"
      >
        Switch to Pronto
      </a>
      {call && (
        <a
          className="rd__link rd__link--faux-button rd__link--align-left"
          href={`/inspect?conn=${getConnectionString(call)}`}
          rel="noreferrer"
          target="_blank"
        >
          Go to Inspector
        </a>
      )}
    </ul>
  );
};

const StartStopBroadcasting = () => {
  const call = useCall();
  const { useIsCallHLSBroadcastingInProgress } = useCallStateHooks();
  const isBroadcasting = useIsCallHLSBroadcastingInProgress();
  return (
    <button
      className="rd__button rd__button--align-left"
      onClick={() => {
        if (!call) return;
        if (isBroadcasting) {
          call.stopHLS().catch((err) => {
            console.error(`Failed to start broadcasting`, err);
          });
        } else {
          call
            .startHLS()
            .then((res) => {
              console.log(`Broadcasting started: ${res.playlist_url}`);
            })
            .catch((err) => {
              console.error(`Failed to stop broadcasting`, err);
            });
        }
      }}
    >
      <Icon
        className="rd__button__icon"
        icon={isBroadcasting ? 'recording-off' : 'recording-on'}
      />
      {isBroadcasting ? 'Stop broadcasting' : 'Start broadcasting'}
    </button>
  );
};

const GoOrStopLive = () => {
  const call = useCall();
  const { useIsCallLive } = useCallStateHooks();
  const isLive = useIsCallLive();
  return (
    <button
      className="rd__button rd__button--align-left"
      onClick={() => {
        if (!call) return;
        if (isLive) {
          call.stopLive().catch((err) => {
            console.error(`Failed to stop live`, err);
          });
        } else {
          call
            .goLive()
            .then((res) => {
              console.log(`Live started: ${res}`);
            })
            .catch((err) => {
              console.error(`Failed to start live`, err);
            });
        }
      }}
    >
      <Icon
        className="rd__button__icon"
        icon={isLive ? 'recording-off' : 'recording-on'}
      />
      {isLive ? 'Stop Live' : 'Go Live'}
    </button>
  );
};

const ConnectToLocalSfu = (props: { port?: number; sfuId?: string }) => {
  const { port = 3031, sfuId = 'SFU-1' } = props;
  const params = new URLSearchParams(window.location.search);
  return (
    <button
      className="rd__button rd__button--align-left"
      onClick={() => {
        params.set('sfuUrl', `http://127.0.0.1:${port}/twirp`);
        params.set('sfuWsUrl', `ws://127.0.0.1:${port}/ws`);
        window.location.search = params.toString();
      }}
    >
      <Icon className="rd__button__icon" icon="mediation" />
      Connect to local {sfuId}
    </button>
  );
};

const RestartPublisher = () => {
  const call = useCall();
  return (
    <button
      className="rd__button rd__button--align-left"
      hidden={!call}
      onClick={() => {
        if (!call) return;
        call.publisher?.restartIce().catch((err) => {
          console.error(`Failed to restart ICE on the publisher`, err);
        });
      }}
    >
      <Icon className="rd__button__icon" icon="recording-off" />
      ICERestart Publisher
    </button>
  );
};

const RestartSubscriber = () => {
  const call = useCall();
  return (
    <button
      className="rd__button rd__button--align-left"
      hidden={!call}
      onClick={() => {
        if (!call) return;
        call.subscriber?.restartIce().catch((err) => {
          console.error(`Failed to restart ICE on the subscriber`, err);
        });
      }}
    >
      <Icon className="rd__button__icon" icon="recording-on" />
      ICERestart Subscriber
    </button>
  );
};

const LogPublisherStats = () => {
  const call = useCall();
  return (
    <button
      className="rd__button rd__button--align-left"
      onClick={() => {
        if (!call) return;
        call.publisher?.getStats().then((stats: RTCStatsReport) => {
          const arr: any = [];
          stats.forEach((value) => {
            arr.push(value);
          });
          console.log('Publisher stats', arr);
        });
      }}
    >
      <Icon className="rd__button__icon" icon="folder" />
      Log Publisher stats
    </button>
  );
};

const LogSubscriberStats = () => {
  const call = useCall();
  return (
    <button
      className="rd__button rd__button--align-left"
      onClick={() => {
        if (!call) return;
        call.subscriber?.getStats().then((stats: RTCStatsReport) => {
          const arr: any = [];
          stats.forEach((value) => {
            arr.push(value);
          });
          console.log('Subscriber stats', arr);
        });
      }}
    >
      <Icon className="rd__button__icon" icon="folder" />
      Log Subscriber stats
    </button>
  );
};

const SfuCallStats = () => {
  const call = useCall();
  return (
    <button
      className="rd__button rd__button--align-left"
      disabled={!call}
      onClick={() => {
        if (!call) return;
        const credentials = call['credentials'];
        if (!credentials) return;
        const token = credentials.token;
        const [, claims] = token.split('.');
        const decoded = JSON.parse(decodeBase64(claims)) as Record<string, any>;
        const appId = decoded['app_id'] as string;
        const sfuUrl = credentials.server.url.replace('/twirp', '');
        const url = `${sfuUrl}:5100/debug/calls/${appId}/${call.cid}/subscriptions`;
        window.open(url, '_blank');
      }}
    >
      <Icon className="rd__button__icon" icon="folder" />
      SFU Call State Info
    </button>
  );
};

const TraceStats = () => {
  const call = useCall();
  if (!call) return null;
  return (
    <button
      className="rd__button rd__button--align-left"
      disabled={!call}
      onClick={() => {
        const appId = process.env.NEXT_PUBLIC_STREAM_APP_ID || '';
        if (!appId) return window.open('http://localhost:8081/', '_blank');
        const path = `app/${appId}/${call.cid}/${call.state.session?.id}/`;
        window.open(
          `http://localhost:8081/?path=${encodeURIComponent(path)}`,
          '_blank',
        );
      }}
    >
      <Icon className="rd__button__icon" icon="folder" />
      Trace Stats
    </button>
  );
};
