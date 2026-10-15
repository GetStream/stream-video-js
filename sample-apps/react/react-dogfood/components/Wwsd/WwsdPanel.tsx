import { useState } from 'react';
import { ActionBar } from './ActionBar';
import { CardStack } from './CardStack';
import { DealSheet } from './DealSheet';
import { RecapModal } from './RecapModal';
import { ShareCustomerLink } from './ShareCustomerLink';
import { TranscriptStrip } from './TranscriptStrip';
import { useWwsd } from './WwsdContext';
import { WwsdHeader } from './WwsdHeader';

export const WwsdPanel = (props: {
  onClose: () => void;
  onLeave: () => void;
}) => {
  const { onClose, onLeave } = props;
  const { actions } = useWwsd();
  const [recapOpen, setRecapOpen] = useState(false);

  const openRecap = () => {
    setRecapOpen(true);
    actions
      .requestRecap()
      .catch((err) => console.warn('[wwsd] recap failed', err));
  };

  return (
    <div className="rd__wwsd">
      <WwsdHeader
        onClose={onClose}
        onRecap={openRecap}
        share={<ShareCustomerLink />}
      />
      <div className="rd__wwsd-stack">
        <DealSheet />
        <CardStack />
      </div>
      <TranscriptStrip />
      <ActionBar />
      {recapOpen && (
        <RecapModal onClose={() => setRecapOpen(false)} onLeave={onLeave} />
      )}
    </div>
  );
};
