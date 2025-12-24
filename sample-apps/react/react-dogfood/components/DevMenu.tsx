import { Icon, useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { decodeBase64 } from 'stream-chat';
import { useRouter } from 'next/router';
import { getConnectionString } from '../lib/connectionString';

export const DevMenu = () => {
  const call = useCall();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const router = useRouter();
  const withParams = (url: string) => {
    const targetUrl = new URL(url, window.location.origin);
    const existingParams = targetUrl.searchParams;
    const params = router.query;
    for (const key in params) {
      existingParams.set(key, params[key] as string);
    }
    return targetUrl.toString();
  };
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
        <StartStopCompositeRecording />
      </li>
      <li className="rd__dev-menu__item">
        <StartStopIndividualRecording />
      </li>
      <li className="rd__dev-menu__item">
        <StartStopRawRecording />
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
          href={withParams(
            `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/call-recordings`,
          )}
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
      {call && (
        <a
          className="rd__link rd__link--faux-button rd__link--align-left"
          href={withParams(`/stats/${call.cid}`)}
          rel="noreferrer"
          target="_blank"
        >
          Go to Participant Stats
        </a>
      )}
      {call && localParticipant && (
        <a
          className="rd__link rd__link--faux-button rd__link--align-left"
          href={withParams(
            `/stats/${call.cid}?user_id=${call.currentUserId}&user_session_id=${call['unifiedSessionId'] || localParticipant.sessionId}&kind=details`,
          )}
          rel="noreferrer"
          target="_blank"
        >
          Go to {localParticipant?.name || 'User'} Stats (Details)
        </a>
      )}
      {call && localParticipant && (
        <a
          className="rd__link rd__link--faux-button rd__link--align-left"
          href={withParams(
            `/stats/${call.cid}?user_id=${call.currentUserId}&user_session_id=${call['unifiedSessionId'] || localParticipant.sessionId}&kind=timeline`,
          )}
          rel="noreferrer"
          target="_blank"
        >
          Go to {localParticipant?.name || 'User'} Stats (Timeline)
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

const StartStopRawRecording = () => {
  const call = useCall();
  const { useIsCallRawRecordingInProgress } = useCallStateHooks();
  const isRawRecording = useIsCallRawRecordingInProgress();
  return (
    <button
      className="rd__button rd__button--align-left"
      onClick={() => {
        if (!call) return;
        if (isRawRecording) {
          call
            .stopRecording('raw')
            .then(() => {
              console.log(`Raw recording stopped`);
            })
            .catch((err) => {
              console.error(`Failed to stop raw recording`, err);
            });
        } else {
          call
            .startRecording('raw')
            .then(() => {
              console.log(`Raw recording started`);
            })
            .catch((err) => {
              console.error(`Failed to start raw recording`, err);
            });
        }
      }}
    >
      <Icon
        className="rd__button__icon"
        icon={isRawRecording ? 'recording-off' : 'recording-on'}
      />
      {isRawRecording ? 'Stop Raw Recording' : 'Start Raw Recording'}
    </button>
  );
};

const StartStopIndividualRecording = () => {
  const call = useCall();
  const { useIsCallIndividualRecordingInProgress } = useCallStateHooks();
  const isIndividualRecording = useIsCallIndividualRecordingInProgress();
  return (
    <button
      className="rd__button rd__button--align-left"
      onClick={() => {
        if (!call) return;
        if (isIndividualRecording) {
          call
            .stopRecording('individual')
            .then(() => {
              console.log(`Individual recording stopped`);
            })
            .catch((err) => {
              console.error(`Failed to stop individual recording`, err);
            });
        } else {
          call
            .startRecording('individual')
            .then(() => {
              console.log(`Individual recording started`);
            })
            .catch((err) => {
              console.error(`Failed to start individual recording`, err);
            });
        }
      }}
    >
      <Icon
        className="rd__button__icon"
        icon={isIndividualRecording ? 'recording-off' : 'recording-on'}
      />
      {isIndividualRecording
        ? 'Stop Individual Recording'
        : 'Start Individual Recording'}
    </button>
  );
};

const StartStopCompositeRecording = () => {
  const call = useCall();
  const { useIsCallRecordingInProgress } = useCallStateHooks();
  const isRecording = useIsCallRecordingInProgress();
  return (
    <button
      className="rd__button rd__button--align-left"
      onClick={() => {
        if (!call) return;
        if (isRecording) {
          call
            .stopRecording('composite')
            .then(() => {
              console.log(`Composite recording stopped`);
            })
            .catch((err) => {
              console.error(`Failed to stop composite recording`, err);
            });
        } else {
          call
            .startRecording('composite')
            .then(() => {
              console.log(`Composite recording started`);
            })
            .catch((err) => {
              console.error(`Failed to start composite recording`, err);
            });
        }
      }}
    >
      <Icon
        className="rd__button__icon"
        icon={isRecording ? 'recording-off' : 'recording-on'}
      />
      {isRecording
        ? 'Stop Composite Recording (new route)'
        : 'Start Composite Recording (new route)'}
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
        if (!appId) return window.open('http://rtcstats.gtstrm.com/', '_blank');
        const path = `app/${appId}/${call.cid}/${call.state.session?.id}/`;
        window.open(`http://rtcstats.gtstrm.com/stats/${path}`, '_blank');
      }}
    >
      <Icon className="rd__button__icon" icon="folder" />
      Trace Stats
    </button>
  );
};
