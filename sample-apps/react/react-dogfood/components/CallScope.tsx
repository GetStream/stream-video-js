import type { INoiseCancellation } from '@stream-io/audio-filters-web';
import {
  BackgroundFiltersProvider,
  Call,
  NoiseCancellationProvider,
  StreamCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import Head from 'next/head';
import { ComponentProps, useEffect, useRef, useState } from 'react';

import { MeetingUI } from './MeetingUI';
import { RingingCallNotification } from './Ringing/RingingCallNotification';
import { TourProvider } from '../context/TourContext';
import { getSegmentationModelUrl } from '../hooks';
import { useSettings } from '../context/SettingsContext';
import { createNoiseCancellation } from '../helpers/noiseCancellation';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const HeadComponent = ({ callId }: { callId: string }) => {
  const { useCallCustomData } = useCallStateHooks();
  const customData = useCallCustomData();

  return (
    <Head>
      <title>Stream Calls: {customData.name || callId}</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
  );
};

/**
 * The call-scoped subtree: the noise-cancellation instance and every provider
 * that binds to a specific call live here, so the call page can swap the active
 * call (e.g. when toggling E2EE) by simply passing a new `call` prop. The swap
 * only reaches these providers once {@link useLobbyCall} has awaited the new
 * call's `getOrCreate`, so it is ready and there is no noise-cancellation
 * capability race.
 */
export const CallScope = ({
  call,
  chatClient,
  useLegacyFilters,
  segmentationModel,
}: {
  call: Call;
  chatClient: ComponentProps<typeof MeetingUI>['chatClient'];
  useLegacyFilters: boolean;
  segmentationModel: Parameters<typeof getSegmentationModelUrl>[0];
}) => {
  const { settings } = useSettings();
  // Read once: changing the setting mid-call applies on the next join.
  const [noiseCancellationModel] = useState(
    () => settings.noiseCancellationModel,
  );
  const [noiseCancellation, setNoiseCancellation] =
    useState<INoiseCancellation>();
  const ncLoader = useRef<Promise<void>>(undefined);
  useEffect(() => {
    const load = (ncLoader.current || Promise.resolve())
      .then(() => createNoiseCancellation(noiseCancellationModel))
      .then((nc) => {
        setNoiseCancellation(nc);
      });
    return () => {
      ncLoader.current = load.then(() => setNoiseCancellation(undefined));
    };
  }, [noiseCancellationModel]);

  return (
    <StreamCall call={call}>
      <HeadComponent callId={call.id} />

      <TourProvider>
        <BackgroundFiltersProvider
          forceSafariSupport
          useLegacyFilter={useLegacyFilters}
          modelFilePath={getSegmentationModelUrl(segmentationModel)}
          backgroundImages={[
            `${basePath}/backgrounds/amsterdam-1.jpg`,
            `${basePath}/backgrounds/amsterdam-2.jpg`,
            `${basePath}/backgrounds/boulder-1.jpg`,
            `${basePath}/backgrounds/boulder-2.jpg`,
            `${basePath}/backgrounds/gradient-1.jpg`,
            `${basePath}/backgrounds/gradient-2.jpg`,
            `${basePath}/backgrounds/gradient-3.jpg`,
          ]}
        >
          {noiseCancellation && (
            <NoiseCancellationProvider noiseCancellation={noiseCancellation}>
              <RingingCallNotification />
              <MeetingUI chatClient={chatClient} />
            </NoiseCancellationProvider>
          )}
        </BackgroundFiltersProvider>
      </TourProvider>
    </StreamCall>
  );
};
