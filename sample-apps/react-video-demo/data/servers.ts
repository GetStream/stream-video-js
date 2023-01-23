import { FeatureCollection, Geometry } from 'geojson';

export const serverMarkerFeatures: FeatureCollection<Geometry> = {
  type: 'FeatureCollection',
  features: [
    {
      id: 'server-1',
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-33.918861, 18.4233],
      },
      properties: {
        name: 'aws ZA',
      },
    },
    {
      id: 'server-2',
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [50.110924, 8.682127],
      },
      properties: {
        name: 'aws DE',
      },
    },
    {
      id: 'server-3',
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [19.228825, 72.854118],
      },
      properties: {
        name: 'aws IN',
      },
    },
    {
      id: 'server-4',
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-23.533773, -46.62529],
      },
      properties: {
        name: 'aws BR',
      },
    },
    {
      id: 'server-5',
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [1.283333, 103.833333],
      },
      properties: {
        name: 'aws SG',
      },
    },
    {
      id: 'server-6',
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-33.865143, 151.2099],
      },
      properties: {
        name: 'aws AU',
      },
    },
    {
      id: 'server-7',
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [35.685013, 139.752445],
      },
      properties: {
        name: 'aws JP',
      },
    },
    {
      id: 'server-8',
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [59.43696, 24.75353],
      },
      properties: {
        name: 'blu EE',
      },
    },
    {
      id: 'server-9',
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [39.739167, -104.984722],
      },
      properties: {
        name: 'dpk US',
      },
    },
    {
      id: 'server-10',
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [40.712778, -74.006111],
      },
      properties: {
        name: 'eqx US',
      },
    },
    {
      id: 'server-11',
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [52.377956, 4.89707],
      },
      properties: {
        name: 'fdc NL',
      },
    },
    {
      id: 'server-12',
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [52.377956, 4.89707],
      },
      properties: {
        name: 'lsw NL',
      },
    },
    {
      id: 'server-13',
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [50.849722, 5.693056],
      },
      properties: {
        name: 'ovh DE',
      },
    },
    {
      id: 'server-14',
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [51.507359, -0.136439],
      },
      properties: {
        name: 'ovh GB',
      },
    },
  ],
};
