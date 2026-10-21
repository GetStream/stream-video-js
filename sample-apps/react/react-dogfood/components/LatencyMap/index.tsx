import dynamic from 'next/dynamic';
import type { Props } from './LatencyMap';

const Placeholder = () => <div className="rd__latencymap" />;

const LazyLatencyMap = dynamic(
  () => import('./LatencyMap').then((mod) => mod.LatencyMap),
  { ssr: false, loading: Placeholder },
);

/**
 * Loads mapbox-gl only when the map can actually be shown.
 */
export const LatencyMap = (props: Props) =>
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
    <LazyLatencyMap {...props} />
  ) : (
    <Placeholder />
  );
