import { useRef, useState } from 'react';
import { CallStats } from '../StreamCall/CallStats';
import { CompositeButton, IconButton } from '../Button/';

type CallStatsButtonProps = {
  caption?: string;
};

export const CallStatsButton = ({
  caption = 'Stats',
}: CallStatsButtonProps) => {
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const statsAnchorRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      {isStatsOpen && (
        <CallStats
          anchor={statsAnchorRef.current!}
          onClose={() => {
            setIsStatsOpen(false);
          }}
        />
      )}
      <CompositeButton enabled={isStatsOpen} caption={caption}>
        <IconButton
          icon="stats"
          title="Statistics"
          ref={statsAnchorRef}
          onClick={() => {
            setIsStatsOpen((v) => !v);
          }}
        />
      </CompositeButton>
    </>
  );
};
