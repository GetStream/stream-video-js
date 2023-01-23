import * as React from 'react';
import { CallStats } from '../StreamCall/CallStats';
import { CallControlsButton } from './CallControlsButton';
import { useRef, useState } from 'react';

export const CallStatsButton = () => {
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
      <CallControlsButton
        icon="stats"
        title="Statistics"
        ref={statsAnchorRef}
        onClick={() => {
          setIsStatsOpen((v) => !v);
        }}
      />
    </>
  );
};
