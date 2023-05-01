import { EdgeResponse } from '@stream-io/video-react-sdk';
import { Feature, FeatureCollection, Geometry } from 'geojson';

const continents: any = {
  AF: 'Africa',
  NA: 'North America',
  OC: 'Oceania',
  AN: 'Antarctica',
  AS: 'Asia',
  EU: 'Europe',
  SA: 'South America',
};

export interface EdgeResponseExtended extends EdgeResponse {
  country_iso_code: string;
  continent_code: string;
}

export const createGeoJsonFeatures = (
  edges: EdgeResponseExtended[],
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
        countryCode: edge.country_iso_code,
        continent: continents[edge.continent_code],
        ...edge,
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features: features,
  };
};
