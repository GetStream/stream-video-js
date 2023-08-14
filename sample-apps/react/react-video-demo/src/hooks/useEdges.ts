import { useEffect, useState } from 'react';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { FeatureCollection, Geometry } from 'geojson';
import { createGeoJsonFeatures } from '../utils/useCreateGeoJsonFeatures';

const EDGES_KEY = '@react-video-demo/edges';
const oneDay = 24 * 3600 * 1000;

type CachedEdges = {
  edges: FeatureCollection<Geometry>;
  expires_at: number;
};

const cacheEdges = (edges: FeatureCollection<Geometry>) => {
  const payload: CachedEdges = {
    edges,
    expires_at: new Date().getTime() + oneDay,
  };
  localStorage.setItem(EDGES_KEY, JSON.stringify(payload));

  return payload;
};

const getCachedEdges = (): CachedEdges | undefined => {
  const edgeJSON = localStorage.getItem(EDGES_KEY);
  return edgeJSON ? JSON.parse(edgeJSON) : undefined;
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
