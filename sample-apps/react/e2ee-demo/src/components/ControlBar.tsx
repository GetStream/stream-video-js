import { useMemo, useState } from 'react';
import {
  EncryptionManager,
  EncryptionSettingsResponseModeEnum,
} from '@stream-io/video-react-sdk';
import { MAX_PARTICIPANTS } from '../config';
import { useHarnessEngine, useSnapshot } from '../hooks/useHarness';
import type { PreferredCodec } from '../harness/snapshot';
import { detectTransformSupport } from '../harness/transformSupport';
import './ControlBar.css';

interface ControlBarProps {
  showKeys: boolean;
  onToggleKeys: () => void;
}

export const ControlBar = ({ showKeys, onToggleKeys }: ControlBarProps) => {
  const engine = useHarnessEngine();
  const {
    config,
    participants,
    globalError,
    resolvedEncryptionMode,
    e2eeEnabled,
  } = useSnapshot();
  const isSupported = EncryptionManager.isSupported();
  const support = useMemo(detectTransformSupport, []);
  const [shared, setShared] = useState('');

  // What this browser can do, as a plain capability list. The SDK owns the
  // choice between the two APIs and does not expose it, so the harness states
  // facts instead of predicting the pick.
  const capabilities = [
    support.hasInsertableStreams && 'Insertable Streams',
    support.hasScriptTransform && 'RTCRtpScriptTransform',
  ].filter(Boolean);

  const joined = participants.length;
  const normals = participants.filter((p) => p.role === 'normal').length;
  const atCapacity = normals >= MAX_PARTICIPANTS;

  return (
    <header className="control-bar">
      <div className="control-bar__row">
        <h1 className="control-bar__title">Stream E2EE Harness</h1>
        <span className="control-bar__call-id">
          call: <code>{config.callType}</code>:<code>{config.callId}</code>
        </span>
        <span className={`control-bar__badge ${isSupported ? 'ok' : 'no'}`}>
          {isSupported ? 'E2EE supported' : 'E2EE not supported'}
        </span>
        {resolvedEncryptionMode && (
          <span
            className={`control-bar__badge ${
              resolvedEncryptionMode ===
              EncryptionSettingsResponseModeEnum.DISABLED
                ? 'no'
                : 'ok'
            }`}
            title="Encryption mode the backend resolved for this call, from the call settings. This is only what the call permits: the SFU badge says whether E2EE is actually active."
          >
            mode: {resolvedEncryptionMode}
          </span>
        )}
        {joined > 0 && (
          <span
            className={`control-bar__badge ${e2eeEnabled ? 'ok' : 'no'}`}
            title="Whether the SFU reports E2EE as actually active for this call (JoinResponse). This is the authoritative signal - the mode badge only says what the call permits."
          >
            SFU: E2EE {e2eeEnabled ? 'active' : 'inactive'}
          </span>
        )}
        <button
          className={`control-bar__keys-toggle ${showKeys ? 'active' : ''}`}
          onClick={onToggleKeys}
          title="Manually set or override participant keys (for multi-tab testing)"
        >
          🔑 Keys {showKeys ? '▲' : '▼'}
        </button>
      </div>

      <div className="control-bar__row">
        <label title="Applies to the next participant added">
          Codec
          <select
            value={config.codec}
            onChange={(e) =>
              engine.setConfig({ codec: e.target.value as PreferredCodec })
            }
          >
            <option value="vp8">VP8</option>
            <option value="vp9">VP9</option>
            <option value="h264">H.264</option>
          </select>
        </label>
        <span
          className="control-bar__hint"
          title="Which Encoded Transform API the SDK attaches is its own choice (Insertable Streams on Chrome, RTCRtpScriptTransform elsewhere)"
        >
          {capabilities.length
            ? `browser has: ${capabilities.join(', ')}`
            : 'no encoded transform API'}
        </span>
        <label title="Switch anytime; setting a shared key converts everyone">
          KeyMode
          <select
            value={config.keyMode}
            onChange={(e) =>
              engine.setConfig({
                keyMode: e.target.value as 'per-user' | 'shared',
              })
            }
          >
            <option value="per-user">per-user</option>
            <option value="shared">shared</option>
          </select>
        </label>
        <button
          onClick={() => engine.addParticipant(true)}
          disabled={atCapacity || !isSupported}
          title="Join with an E2EE manager attached: the SDK declares e2ee on join and encrypts every frame"
        >
          Join (E2EE) ({normals}/{MAX_PARTICIPANTS})
        </button>
        <button
          className="control-bar__plain"
          onClick={() => engine.addParticipant(false)}
          // A plain participant needs no Encoded Transforms, so browser support
          // does not gate it: testing the non-E2EE path on a browser without
          // E2EE is a case worth having.
          disabled={atCapacity}
          title="Join without an E2EE manager: no encoded transforms, media published in the clear"
        >
          Join (plain)
        </button>
        <button
          onClick={() => engine.addSpy()}
          disabled={participants.some((p) => p.role === 'spy')}
          title="Join a participant that is admitted to the call but never receives keys"
        >
          + Keyless
        </button>
        {config.keyMode === 'shared' && (
          <span className="control-bar__shared">
            <input
              type="text"
              placeholder="shared passphrase..."
              value={shared}
              onChange={(e) => setShared(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && shared.trim()) {
                  engine.setSharedKey(shared.trim());
                }
              }}
            />
            <button
              disabled={!shared.trim()}
              onClick={() => engine.setSharedKey(shared.trim())}
            >
              Set shared key
            </button>
          </span>
        )}
      </div>

      {globalError && (
        <div className="control-bar__row control-bar__error" role="alert">
          <span>{globalError}</span>
          <button onClick={() => engine.dismissError()}>Dismiss</button>
        </div>
      )}
    </header>
  );
};
