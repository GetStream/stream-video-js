import { useState, useCallback } from 'react';
import type {
  EncryptionManager,
  KeyStateReport,
} from '@stream-io/video-react-sdk';
import './KeyStateDump.css';

interface KeyStateDumpProps {
  e2eeManager: EncryptionManager;
}

export const KeyStateDump = ({ e2eeManager }: KeyStateDumpProps) => {
  const [report, setReport] = useState<KeyStateReport | null>(null);
  const [open, setOpen] = useState(false);

  const handleDump = useCallback(async () => {
    const state = await e2eeManager.requestKeyDump();
    setReport(state);
    setOpen(true);
  }, [e2eeManager]);

  return (
    <div className="key-dump">
      <button className="key-dump__toggle" onClick={handleDump}>
        {open ? 'Refresh' : 'Show'} Worker Keys
      </button>
      {open && report && (
        <div className="key-dump__content">
          <button className="key-dump__close" onClick={() => setOpen(false)}>
            &times;
          </button>
          {report.sharedKey && (
            <div className="key-dump__section">
              <span className="key-dump__label">Shared</span>
              <code className="key-dump__hex" title={report.sharedKey.keyHex}>
                #{report.sharedKey.keyIndex} {report.sharedKey.keyHex}
              </code>
            </div>
          )}
          {report.perUserKeys.length > 0 ? (
            report.perUserKeys.map((k) => (
              <div
                className="key-dump__section"
                key={`${k.userId}:${k.keyIndex}`}
              >
                <span className="key-dump__label" title={k.userId}>
                  {k.userId.slice(0, 16)}...
                </span>
                <code className="key-dump__hex" title={k.keyHex}>
                  #{k.keyIndex} {k.keyHex}
                </code>
              </div>
            ))
          ) : (
            <div className="key-dump__empty">No per-user keys</div>
          )}
        </div>
      )}
    </div>
  );
};
