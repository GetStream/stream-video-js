import { useState } from 'react';
import { toHex } from '../e2ee/keys';
import './KeyControls.css';

interface KeyControlsProps {
  currentKey: ArrayBuffer;
  keyIndex: number;
  color: string;
  onRotate: (localOnly: boolean) => void;
  onSetKey: (input: string, localOnly: boolean) => void;
}

export const KeyControls = ({
  currentKey,
  keyIndex,
  color,
  onRotate,
  onSetKey,
}: KeyControlsProps) => {
  const [input, setInput] = useState('');
  const [localOnly, setLocalOnly] = useState(false);
  const hex = toHex(currentKey);

  const handleSetKey = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSetKey(trimmed, localOnly);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSetKey();
  };

  return (
    <div className="key-controls">
      <div className="key-controls__current">
        <span className="key-controls__label">Current Key</span>
        <code className="key-controls__hex" title={hex}>
          {hex}
        </code>
        <span
          className="key-controls__index"
          style={{ backgroundColor: color }}
        >
          #{keyIndex}
        </span>
      </div>

      <div className="key-controls__actions">
        <input
          className="key-controls__input"
          type="text"
          placeholder="Hex key or passphrase..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="key-controls__btn key-controls__btn--set"
          onClick={handleSetKey}
          disabled={!input.trim()}
        >
          Set Key
        </button>
        <button
          className="key-controls__btn key-controls__btn--rotate"
          onClick={() => onRotate(localOnly)}
        >
          Rotate
        </button>
      </div>

      <label className="key-controls__local-only">
        <input
          type="checkbox"
          checked={localOnly}
          onChange={(e) => setLocalOnly(e.target.checked)}
        />
        <span>Local only</span>
        <span className="key-controls__local-only-hint">
          (skip distribution — causes key mismatch)
        </span>
      </label>
    </div>
  );
};
