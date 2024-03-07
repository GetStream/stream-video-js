import { useEffect, useState } from 'react';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { FeatureCollection } from 'geojson';
import { createGeoJsonFeatures } from './useCreateGeoJsonFeatures';

const EDGES_KEY = '@pronto/edges';
const oneDay = 24 * 3600 * 1000;

type CachedEdges = {
  edges: FeatureCollection;
  expires_at: number;
};

const cacheEdges = (edges: FeatureCollection) => {
  const payload: CachedEdges = {
    edges,
    expires_at: new Date().getTime() + oneDay,
  };
  try {
    localStorage.setItem(EDGES_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn(`Failed to store edges in the cache`);
  }

  return payload;
};

const getCachedEdges = (): CachedEdges | undefined => {
  try {
    const edgeJSON = localStorage.getItem(EDGES_KEY);
    if (!edgeJSON) return;
    return JSON.parse(edgeJSON);
  } catch {
    return undefined;
  }
};

export const useEdges = () => {
  const [edges, setEdges] = useState<CachedEdges | undefined>(getCachedEdges);
  const [fastestEdge] = useState<{
    id: string;
    latency: number;
  }>();

  const client = useStreamVideoClient();
  useEffect(() => {
    if (!client || (edges?.expires_at ?? 0 > new Date().getTime())) return;
    client.edges().then((response) => {
      setEdges(cacheEdges(createGeoJsonFeatures(response.edges)));
    });
  }, [client, edges?.expires_at]);

  return {
    edges: edges?.edges,
    fastestEdge,
  };
};
