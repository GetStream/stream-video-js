import { FeatureCollection, Geometry } from 'geojson';

export const serverMarkerFeatures: FeatureCollection<Geometry> = {
  type: 'FeatureCollection',
  features: [
    {
      id: 1,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [18.4233, -33.91886],
      },
      properties: {
        abbriviation: 'AWS',
        city: 'Cape Town',
        countryCode: 'ZA',
      },
    },
    {
      id: 2,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [8.682127, 50.110924],
      },
      properties: {
        abbriviation: 'AWS',
        city: 'Hamburg',
        countryCode: 'DE',
      },
    },
    {
      id: 3,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [72.854118, 19.228825],
      },
      properties: {
        abbriviation: 'AWS',
        city: 'Delhi',
        countryCode: 'IN',
      },
    },
    {
      id: 4,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-46.62529, -23.53377],
      },
      properties: {
        abbriviation: 'AWS',
        city: 'Sao Paulo',
        countryCode: 'BR',
      },
    },
    {
      id: 5,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [103.833333, 1.283333],
      },
      properties: {
        abbriviation: 'AWS',
        city: 'Singapore',
        countryCode: 'SG',
      },
    },
    {
      id: 6,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [151.2099, -33.86514],
      },
      properties: {
        abbriviation: 'AWS',
        city: 'Sydney',
        countryCode: 'AU',
      },
    },
    {
      id: 7,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [139.752445, 35.685013],
      },
      properties: {
        abbriviation: 'AWS',
        city: 'Tokyo',
        countryCode: 'JP',
      },
    },
    {
      id: 8,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [4.75353, 59.43696],
      },
      properties: {
        abbriviation: 'BLU',
        city: 'Talinn',
        countryCode: 'EE',
      },
    },
    {
      id: 9,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-104.984722, 39.739167],
      },
      properties: {
        abbriviation: 'DPK',
        city: 'New York',
        countryCode: 'US',
      },
    },
    {
      id: 10,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-74.006111, 40.712778],
      },
      properties: {
        abbriviation: 'EQX',
        city: 'Boston',
        countryCode: 'US',
      },
    },
    {
      id: 11,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [4.89707, 52.377956],
      },
      properties: {
        abbriviation: 'FDC',
        city: 'Amsterdam',
        countryCode: 'NL',
      },
    },
    {
      id: 12,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [4.89707, 52.377956],
      },
      properties: {
        abbriviation: 'LSW',
        city: 'Amsterdam',
        countryCode: 'NL',
      },
    },
    {
      id: 13,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [5.693056, 50.849722],
      },
      properties: {
        abbriviation: 'OVH',
        city: 'Kohln',
        countryCode: 'DE',
      },
    },
    {
      id: 14,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-0.136439, 51.507359],
      },
      properties: {
        abbriviation: 'OHV',
        city: 'London',
        countryCode: 'GB',
      },
    },
  ],
};
