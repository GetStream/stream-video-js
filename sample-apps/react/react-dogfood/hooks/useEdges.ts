import { useEffect, useState } from 'react';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { FeatureCollection } from 'geojson';
import { createGeoJsonFeatures } from './useCreateGeoJsonFeatures';

const EDGES_KEY = '@react-video-demo/edges';
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

export const useEdges = (client?: StreamVideoClient) => {
  const [edges, setEdges] = useState<CachedEdges | undefined>(getCachedEdges);
  const [fastestEdge] = useState<{
    id: string;
    latency: number;
  }>();

  useEffect(() => {
    if (
      !client ||
      (edges?.expires_at && edges.expires_at > new Date().getTime())
    )
      return;

    client.edges().then((response) => {
      setEdges(cacheEdges(createGeoJsonFeatures(response.edges)));
    });
  }, [client, edges]);

  return {
    edges: edges?.edges,
    fastestEdge,
  };
};
