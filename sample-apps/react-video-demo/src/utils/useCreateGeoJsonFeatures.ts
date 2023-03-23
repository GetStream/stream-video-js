import { EdgeResponse } from '@stream-io/video-client';
import { FeatureCollection, Geometry, Feature } from 'geojson';

export const createGeoJsonFeatures = (
  edges: EdgeResponse[],
): FeatureCollection<Geometry> => {
  const features = edges.map((edge, index): Feature => {
    return {
      id: index + 1,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [edge.longitude, edge.latitude],
      },
      properties: {
        abbriviation: edge.id,
        city: undefined,
        countryCode: undefined,
        ...edge,
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features: features,
  };
};
