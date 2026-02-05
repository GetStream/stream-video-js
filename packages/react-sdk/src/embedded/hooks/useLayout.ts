import { useEffect, useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import type { LayoutOption } from '../types';
import { useEmbeddedConfiguration } from '../context';

const VALID_LAYOUTS: LayoutOption[] = [
  'PaginatedGrid',
  'SpeakerLeft',
  'SpeakerRight',
  'SpeakerTop',
  'SpeakerBottom',
];

const isValidLayout = (layout: string): layout is LayoutOption =>
  VALID_LAYOUTS.includes(layout as LayoutOption);

/**
 * Hook to manage layout selection.
 */
export const useLayout = () => {
  const { layout: configuredLayout } = useEmbeddedConfiguration();
  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();

  const defaultLayout = isValidLayout(configuredLayout ?? '')
    ? configuredLayout!
    : 'SpeakerBottom';

  const [layout, setLayout] = useState<LayoutOption>(defaultLayout);

  useEffect(() => {
    if (hasScreenShare) {
      setLayout((currentLayout) => {
        if (currentLayout.startsWith('Speaker')) return currentLayout;
        return 'SpeakerRight';
      });
    } else {
      setLayout(defaultLayout);
    }
  }, [hasScreenShare, defaultLayout]);

  return { layout };
};
