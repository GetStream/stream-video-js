import './SpyOverlay.css';

export const SpyOverlay = ({ failingCount }: { failingCount: number }) => (
  <div className="spy-overlay">
    <span className="spy-overlay__lock">🔒</span>
    <span className="spy-overlay__title">No key</span>
    <span className="spy-overlay__sub">
      SFU stream is undecryptable
      {failingCount > 0 ? ` (${failingCount} peers)` : ''}
    </span>
  </div>
);
