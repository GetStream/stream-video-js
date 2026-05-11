import { CSSProperties, useEffect, useState } from 'react';
import {
  AudioHealthDirection,
  AudioHealthStatus,
  Call,
  CallControls,
  CallingState,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
  User,
} from '@stream-io/video-react-sdk';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import './style.css';

// For demo credentials, check out our video calling tutorial:
// https://getstream.io/video/sdk/react/tutorial/video-calling/
const userId = 'video-tutorial-' + Math.random().toString(16).substring(2);
const apiKey = 'mmhfdzb5evj2';

// Optional URL overrides - useful for joining a specific call from a webview
// host (e.g. the iOS WKWebView sample). Currently supports ?call_id=...;
// anything else falls back to the tutorial defaults.
const params =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
const callIdOverride = params.get('call_id')?.trim() || null;
const tokenProvider = async () => {
  const provider = new URL('https://pronto.getstream.io/api/auth/create-token');
  provider.searchParams.set('api_key', apiKey);
  provider.searchParams.set('user_id', userId);
  const { token } = await fetch(provider).then((res) => res.json());
  return token as string;
};

const user: User = {
  id: userId,
  name: 'Oliver',
  image: 'https://getstream.io/random_svg/?id=oliver&name=Oliver',
};

// initialize the StreamVideoClient
const client = new StreamVideoClient({ apiKey, user, tokenProvider });

export default function App() {
  const [call, setCall] = useState<Call>();
  useEffect(() => {
    const callId =
      callIdOverride ??
      `video-tutorial-${Math.random().toString(16).substring(2)}`;
    if (callIdOverride) {
      console.info(`[tutorial] joining call from ?call_id=`, callId);
    } else {
      console.info(`[tutorial] joining newly-generated call`, callId);
    }
    // Reflect the active call id into the URL so it can be copied / shared /
    // reloaded without losing the room. Uses replaceState so the browser's
    // back button isn't affected.
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('call_id') !== callId) {
        url.searchParams.set('call_id', callId);
        window.history.replaceState(null, '', url.toString());
      }
    }
    const myCall = client.call('default', callId);
    // Opt into the SDK's experimental audio-health auto-recovery - mutes
    // the mic on `host-audio-session-interrupted` (so remote participants
    // see us as muted, not broken) and cycles the mic on recovery to
    // re-acquire fresh `MediaStreamTrack`s. Replaces the in-tutorial
    // `AudioHealthAutoMute` / `AudioHealthAutoCycle` components that
    // used to live here.
    myCall.enableAudioAutoRecovery();
    myCall.join({ create: true }).catch((err) => {
      console.error(`Failed to join the call`, err);
    });
    // @ts-expect-error makes it easy to debug in the browser console
    window.call = myCall;

    setCall(myCall);

    return () => {
      setCall(undefined);
      myCall.leave().catch((err) => {
        console.error(`Failed to leave the call`, err);
      });
    };
  }, []);

  if (!call) return null;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <UILayout />
      </StreamCall>
    </StreamVideo>
  );
}

export const UILayout = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  if (callingState !== CallingState.JOINED) {
    return <div>Loading...</div>;
  }

  return (
    <StreamTheme>
      <AudioHealthBadge />
      <RecoveryActions />
      <SpeakerLayout participantsBarPosition="bottom" />
      <CallControls />
    </StreamTheme>
  );
};

/**
 * Two manual triage buttons used to verify candidate fixes for the
 * post-CallKit-interruption "audio doesn't resume" bug from inside the iOS
 * WKWebView sample. Both run inside a real React-dispatched click, so any
 * gesture-gated browser API (`HTMLAudioElement.play()`, etc.) gets the
 * gesture credit it needs.
 *
 * - **Resume audio** → `call.resumeAudio()`. Retries `.play()` on every
 *   `<audio>` the SDK has tracked as autoplay-blocked.
 * - **Set audioSession.type=play-and-record** → re-asserts the WebKit hint
 *   that nudges WKWebView toward a WebRTC-friendly AVAudioSession category.
 *   Mirrored to the page console so it shows up in the iOS sample's
 *   Console tab.
 */
const RecoveryActions = () => {
  const call = useCall();

  const handleResumeAudio = () => {
    console.info('[tutorial] resumeAudio() (manual click)');
    call?.resumeAudio().catch((err) => {
      console.error('[tutorial] resumeAudio failed', err);
    });
  };

  const handleSetAudioSessionType = () => {
    if (typeof navigator === 'undefined') return;
    const audioSession = (
      navigator as Navigator & { audioSession?: { type: string } }
    ).audioSession;
    if (!audioSession) {
      console.warn('[tutorial] navigator.audioSession unavailable');
      return;
    }
    try {
      audioSession.type = 'play-and-record';
      console.info(
        '[tutorial] navigator.audioSession.type =',
        audioSession.type,
      );
    } catch (err) {
      console.error('[tutorial] audioSession.type write failed', err);
    }
  };

  const buttonStyle: CSSProperties = {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid rgba(255, 255, 255, 0.25)',
    background: 'rgba(0, 0, 0, 0.75)',
    color: '#fff',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: 11,
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 48,
        left: 12,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
      }}
      data-testid="recovery-actions"
    >
      <button type="button" onClick={handleResumeAudio} style={buttonStyle}>
        Resume audio
      </button>
      <button
        type="button"
        onClick={handleSetAudioSessionType}
        style={buttonStyle}
      >
        Set audioSession.type=play-and-record
      </button>
    </div>
  );
};

/**
 * Tiny status chip in the top-left corner that reflects the SDK's
 * `useAudioHealth()` hook. Two dots - one for the capture (mic) path,
 * one for the playback (speaker) path - so direction-specific failures
 * are visible at a glance. The `direction` field on `AudioHealthInfo`
 * resolves which side is actually broken: `'capture'` reds out only the
 * mic, `'playback'` reds out only the speaker, `'both'` reds out both.
 * The `reason` is shown verbatim so the specific cause stays visible.
 * Also logs every transition to the console so it shows up in the iOS
 * WKWebView sample's Console tab (via
 * `Resources/WebScripts/console-mirror.js`).
 */
const AudioHealthBadge = () => {
  const { useAudioHealth } = useCallStateHooks();
  const { status, reason, direction } = useAudioHealth();
  useEffect(() => {
    console.info(
      '[tutorial] audioHealth →',
      status,
      reason,
      `dir=${direction}`,
    );
  }, [status, reason, direction]);

  const micStatus = resolveSideStatus(status, direction, 'capture');
  const speakerStatus = resolveSideStatus(status, direction, 'playback');

  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        left: 12,
        zIndex: 10,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 10px',
        borderRadius: 8,
        background: 'rgba(0, 0, 0, 0.75)',
        color: '#fff',
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 12,
        pointerEvents: 'none',
      }}
      aria-live="polite"
      data-testid="audio-health-badge"
    >
      <SideIndicator label="mic" status={micStatus} />
      <SideIndicator label="spk" status={speakerStatus} />
      <span>({reason})</span>
    </div>
  );
};

/**
 * Resolves the per-direction status for one side of the audio pipeline.
 * Healthy / unknown statuses propagate to both sides as-is. An unhealthy
 * status only flips a side red when the failure's `direction` actually
 * implicates that side: a `'capture'` failure leaves the speaker green,
 * a `'playback'` failure leaves the mic green, and `'both'` reds them
 * out together.
 */
const resolveSideStatus = (
  status: AudioHealthStatus,
  direction: AudioHealthDirection,
  side: 'capture' | 'playback',
): AudioHealthStatus => {
  if (status !== 'unhealthy') return status;
  if (direction === 'both') return 'unhealthy';
  return direction === side ? 'unhealthy' : 'healthy';
};

const DOT_COLOR: Record<AudioHealthStatus, string> = {
  healthy: '#22c55e', // green
  unhealthy: '#ef4444', // red
  unknown: '#9ca3af', // grey
};

const SideIndicator = ({
  label,
  status,
}: {
  label: string;
  status: AudioHealthStatus;
}) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    {label}
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        background: DOT_COLOR[status],
        boxShadow: `0 0 6px ${DOT_COLOR[status]}`,
      }}
    />
  </span>
);
