import { useState } from 'react';
import { useHarnessEngine, useSnapshot } from '../hooks/useHarness';
import './KeyOverridePanel.css';

interface KeyOverridePanelProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Manually set the encryption key of any participant in the call - local or
 * remote (including peers joined from other tabs/browsers). Paste the same
 * value in each tab to make them interoperate; keys are not auto-distributed.
 *
 * Rendered as a floating overlay toggled from the header so it does not take
 * layout space when closed.
 */
export const KeyOverridePanel = ({ open, onClose }: KeyOverridePanelProps) => {
  const engine = useHarnessEngine();
  const { roster } = useSnapshot();
  const [values, setValues] = useState<Record<string, string>>({});

  if (!open) return null;

  const apply = (userId: string) => {
    const value = (values[userId] ?? '').trim();
    if (!value) return;
    engine.overrideKey(userId, value);
    // Keep the value in the input so it can be copied into another tab/browser.
  };

  return (
    <section className="key-override">
      <div className="key-override__head">
        <div className="key-override__head-text">
          <h2 className="key-override__title">Manual key override</h2>
          <p className="key-override__hint">
            Set any participant&apos;s key (32-char hex or passphrase). Paste
            the same value into the other tab/browser to decrypt each other.
            Applied at a fixed key index; not auto-distributed.
          </p>
        </div>
        <button
          className="key-override__close"
          onClick={onClose}
          title="Close"
          aria-label="Close key override panel"
        >
          &times;
        </button>
      </div>
      {roster.length === 0 ? (
        <p className="key-override__empty">
          No participants in the call yet. Add one, or wait for a peer to join
          from another tab.
        </p>
      ) : (
        <div className="key-override__rows">
          {roster.map((r) => (
            <div key={r.userId} className="key-override__row">
              <span className="key-override__name">
                {r.name}
                {r.isLocal && (
                  <span className="key-override__badge">local</span>
                )}
              </span>
              <code className="key-override__id" title={r.userId}>
                {r.userId.slice(0, 14)}
              </code>
              <input
                className="key-override__input"
                type="text"
                placeholder="hex or passphrase..."
                value={values[r.userId] ?? ''}
                onChange={(e) =>
                  setValues((s) => ({ ...s, [r.userId]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') apply(r.userId);
                }}
              />
              <button
                className="key-override__btn"
                disabled={!(values[r.userId] ?? '').trim()}
                onClick={() => apply(r.userId)}
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
