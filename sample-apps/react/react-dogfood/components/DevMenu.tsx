import { useCallback, useMemo } from 'react';
import {
  DropDownSelect,
  DropDownSelectOption,
  Icon,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { decodeBase64 } from 'stream-chat';
import { useRouter } from 'next/router';
import { getConnectionString } from '../lib/connectionString';

// `RTCRtpEncodingParameters.codec` (per-encoding codec selection) is newer than
// the DOM typedefs shipped with the repo's TS lib, so widen it locally.
type EncodingWithCodec = RTCRtpEncodingParameters & {
  codec?: RTCRtpCodecParameters;
};

// codec subtypes that are infrastructure, not selectable media codecs
const NON_MEDIA_CODECS = new Set([
  'rtx',
  'red',
  'ulpfec',
  'flexfec-03',
  'cn',
  'telephone-event',
]);

// best-effort friendly names keyed by the first 4 hex chars of profile-level-id
const H264_PROFILES: Record<string, string> = {
  '42e0': 'constrained baseline',
  '4200': 'baseline',
  '4d00': 'main',
  '6400': 'high',
  '640c': 'high',
  f400: 'high 4:4:4',
};

const fmtpParam = (fmtp: string | undefined, key: string): string | undefined =>
  fmtp
    ?.split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${key}=`))
    ?.slice(key.length + 1);

// human label that distinguishes codec AND profile, e.g.
// "H264 high (640c1f) pm1", "H264 constrained baseline (42e01f) pm1",
// "VP9 profile 2", "AV1 profile 0", "VP8", "OPUS"
const describeCodec = (codec: RTCRtpCodecParameters): string => {
  const name = (codec.mimeType.split('/')[1] || codec.mimeType).toUpperCase();
  const fmtp = codec.sdpFmtpLine;
  if (name === 'H264') {
    const pli = fmtpParam(fmtp, 'profile-level-id');
    const pm = fmtpParam(fmtp, 'packetization-mode');
    const profile = pli
      ? H264_PROFILES[pli.slice(0, 4).toLowerCase()]
      : undefined;
    return `H264${profile ? ` ${profile}` : ''}${pli ? ` (${pli})` : ''}${
      pm ? ` pm${pm}` : ''
    }`;
  }
  if (name === 'VP9') {
    const p = fmtpParam(fmtp, 'profile-id');
    return `VP9${p ? ` profile ${p}` : ''}`;
  }
  if (name === 'AV1') {
    const p = fmtpParam(fmtp, 'profile');
    return `AV1${p ? ` profile ${p}` : ''}`;
  }
  return name;
};

// stable identity for dedupe / current-codec matching (mimeType + fmtp profile)
const codecKey = (c: { mimeType: string; sdpFmtpLine?: string }) =>
  `${c.mimeType.toLowerCase()}|${c.sdpFmtpLine ?? ''}`;

// reach the protected RTCPeerConnection via the bracket-notation escape hatch,
// mirroring the existing `call['credentials']` access in this file.
const getPublisherPc = (
  call?: ReturnType<typeof useCall>,
): RTCPeerConnection | undefined =>
  call?.publisher?.['pc'] as RTCPeerConnection | undefined;

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
        <CodecSelector kind="video" />
      </li>
      <li className="rd__dev-menu__item">
        <CodecSelector kind="audio" />
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
      <li className="rd__dev-menu__item rd__dev-menu__item--divider" />
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
      <li className="rd__dev-menu__item rd__dev-menu__item--divider" />
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
            `/stats/${call.cid}?user_id=${call.currentUserId}&user_session_id=${
              call['unifiedSessionId'] || localParticipant.sessionId
            }&kind=details`,
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
            `/stats/${call.cid}?user_id=${call.currentUserId}&user_session_id=${
              call['unifiedSessionId'] || localParticipant.sessionId
            }&kind=timeline`,
          )}
          rel="noreferrer"
          target="_blank"
        >
          Go to {localParticipant?.name || 'User'} Stats (Timeline)
        </a>
      )}
      {call && (
        <a
          className="rd__link rd__link--faux-button rd__link--align-left"
          href={withParams(`/stats/map/${call.cid}`)}
          rel="noreferrer"
          target="_blank"
        >
          Go to Call Stats Map
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

/**
 * Switches the active publish codec for a given track kind in place, without
 * triggering an SDP renegotiation. Reads the negotiated codecs from the
 * publisher sender's `getParameters().codecs` and applies the chosen one via
 * `encodings[].codec` + `setParameters()`. Distinct codec profiles (e.g. H264
 * constrained-baseline vs high) are listed as separate options.
 *
 * Dev tool only: requires Chrome 111+ / recent Safari & Firefox, and only
 * codecs already present in the negotiated SDP can be selected.
 */
const CodecSelector = ({ kind }: { kind: 'video' | 'audio' }) => {
  const call = useCall();

  // recompute on each menu mount (DevMenu mounts when opened, mid-call)
  const { options, currentIndex } = useMemo(() => {
    const pc = getPublisherPc(call);
    const sender = pc?.getSenders().find((s) => s.track?.kind === kind);
    const params = sender?.getParameters();
    const seen = new Set<string>();
    const opts = (params?.codecs ?? []).filter((c) => {
      const sub = (c.mimeType.split('/')[1] || '').toLowerCase();
      if (NON_MEDIA_CODECS.has(sub)) return false;
      const key = codecKey(c);
      if (seen.has(key)) return false; // drop exact dupes; keep distinct profiles
      seen.add(key);
      return true;
    });
    const active = (params?.encodings?.[0] as EncodingWithCodec | undefined)
      ?.codec;
    const activeKey = active ? codecKey(active) : undefined;
    const idx = activeKey
      ? Math.max(
          0,
          opts.findIndex((c) => codecKey(c) === activeKey),
        )
      : 0;
    return { options: opts, currentIndex: idx };
  }, [call, kind]);

  const handleSelect = useCallback(
    (index: number) => {
      const chosen = options[index];
      const pc = getPublisherPc(call);
      if (!chosen || !pc) return;
      const senders = pc.getSenders().filter((s) => s.track?.kind === kind);
      for (const sender of senders) {
        const params = sender.getParameters();
        if (!params.encodings?.length) continue;
        for (const enc of params.encodings) {
          (enc as EncodingWithCodec).codec = chosen;
        }
        sender
          .setParameters(params)
          .catch((err) => console.error(`Failed to switch ${kind} codec`, err));
      }
    },
    [call, kind, options],
  );

  if (!call || options.length === 0) {
    return (
      <button className="rd__button rd__button--align-left" disabled>
        <Icon className="rd__button__icon" icon="mediation" />
        No {kind} codecs
      </button>
    );
  }

  return (
    <DropDownSelect
      icon="mediation"
      defaultSelectedIndex={currentIndex}
      defaultSelectedLabel={`${
        kind === 'video' ? 'Video' : 'Audio'
      }: ${describeCodec(options[currentIndex])}`}
      handleSelect={handleSelect}
    >
      {options.map((c, i) => (
        <DropDownSelectOption
          key={`${codecKey(c)}-${i}`}
          label={describeCodec(c)}
          selected={i === currentIndex}
        />
      ))}
    </DropDownSelect>
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
