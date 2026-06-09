import './SpyOverlay.css';

export const SpyOverlay = () => (
  <div className="spy-overlay">
    <span className="spy-overlay__lock">🔒</span>
    <span className="spy-overlay__title">No keys</span>
    <span className="spy-overlay__sub">peers&apos; media is undecryptable</span>
  </div>
);
