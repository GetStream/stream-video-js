import { useMemo, useState } from 'react';
import { EncryptionManager } from '@stream-io/video-react-sdk';
import { MAX_PARTICIPANTS } from '../config';
import { useHarnessEngine, useSnapshot } from '../hooks/useHarness';
import type { PreferredCodec, TransformPath } from '../harness/snapshot';
import {
  detectTransformSupport,
  transformLabels,
} from '../harness/transformSupport';
import './ControlBar.css';

interface ControlBarProps {
  showKeys: boolean;
  onToggleKeys: () => void;
}

export const ControlBar = ({ showKeys, onToggleKeys }: ControlBarProps) => {
  const engine = useHarnessEngine();
  const { config, participants, globalError } = useSnapshot();
  const isSupported = EncryptionManager.isSupported();
  const support = useMemo(detectTransformSupport, []);
  const [shared, setShared] = useState('');

  const transformOption = (path: TransformPath, available: boolean): string => {
    const tags: string[] = [];
    if (support.recommended === path) tags.push('detected');
    if (!available) tags.push('unavailable, falls back');
    const base = transformLabels[path];
    return tags.length ? `${base} (${tags.join(', ')})` : base;
  };

  const joined = participants.length;
  const normals = participants.filter((p) => p.role === 'normal').length;
  // The transform locks after the first join: each peer connection is created
  // with it and it cannot change mid-call. KeyMode is not locked - switching to
  // shared and setting a shared key converts everyone at any point.
  const transformLocked = joined > 0;

  return (
    <header className="control-bar">
      <div className="control-bar__row">
        <h1 className="control-bar__title">Stream E2EE Harness</h1>
        <span className="control-bar__call-id">
          call: <code>{config.callId}</code>
        </span>
        <span className={`control-bar__badge ${isSupported ? 'ok' : 'no'}`}>
          {isSupported ? 'E2EE supported' : 'E2EE not supported'}
        </span>
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
            <option value="av1">AV1</option>
          </select>
        </label>
        <label title="Auto-detected for this browser; locks after the first participant joins">
          Transform
          <select
            value={config.transform}
            disabled={transformLocked}
            onChange={(e) =>
              engine.setConfig({ transform: e.target.value as TransformPath })
            }
          >
            <option value="insertable">
              {transformOption('insertable', support.hasInsertableStreams)}
            </option>
            <option value="script">
              {transformOption('script', support.hasScriptTransform)}
            </option>
          </select>
          {support.recommended && (
            <span className="control-bar__hint">
              auto: {transformLabels[support.recommended]}
            </span>
          )}
        </label>
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
          onClick={() => engine.addParticipant()}
          disabled={normals >= MAX_PARTICIPANTS || !isSupported}
        >
          + Participant ({normals}/{MAX_PARTICIPANTS})
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
