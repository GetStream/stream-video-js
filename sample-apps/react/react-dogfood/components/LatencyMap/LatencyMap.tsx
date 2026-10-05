import { useEffect, useRef, useState } from 'react';
import mapboxgl, { type GeoJSONSource } from 'mapbox-gl';
import { FeatureCollection } from 'geojson';
import { useSettings } from '../../context/SettingsContext';
import type { ThemeMode } from '../../hooks';

const ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const MAP_STYLE = 'mapbox://styles/mapbox/standard';
const BASEMAP_CONFIG = {
  theme: 'monochrome',
  showPlaceLabels: false,
  showRoadLabels: false,
  showPointOfInterestLabels: false,
  showTransitLabels: false,
  show3dObjects: false,
};
const THEMES: Record<
  ThemeMode,
  { lightPreset: 'day' | 'dusk'; water: string; land: string }
> = {
  light: { lightPreset: 'day', water: '#dbdbdc', land: '#f8f8f9' },
  dark: { lightPreset: 'dusk', water: '#212326', land: '#171717' },
};
const WORLD: GeoJSON.Feature = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-180, -85],
        [180, -85],
        [180, 85],
        [-180, 85],
        [-180, -85],
      ],
    ],
  },
};

const addFlatBasemap = (instance: mapboxgl.Map, themeMode: ThemeMode) => {
  const { water, land } = THEMES[themeMode];
  instance.addSource('flat-water', { type: 'geojson', data: WORLD });
  instance.addLayer({
    id: 'flat-water',
    type: 'fill',
    source: 'flat-water',
    slot: 'bottom',
    paint: {
      'fill-color': water,
      'fill-emissive-strength': 1,
      'fill-antialias': false,
    },
  });
  instance.addSource('flat-land', {
    type: 'vector',
    url: 'mapbox://mapbox.country-boundaries-v1',
  });
  instance.addLayer({
    id: 'flat-land',
    type: 'fill',
    source: 'flat-land',
    'source-layer': 'country_boundaries',
    slot: 'bottom',
    paint: {
      'fill-color': land,
      'fill-emissive-strength': 1,
      'fill-antialias': false,
    },
  });
};

export type Props = {
  sourceData?: FeatureCollection;
  zoomLevel?: number;
};

export const LatencyMap = ({ sourceData, zoomLevel = 2 }: Props) => {
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState(sourceData);
  const {
    settings: { themeMode },
  } = useSettings();

  const mapContainer = useRef<any>(undefined);
  const map = useRef<mapboxgl.Map | null>(null);
  const addedFeatureIds = useRef(new Set<string | number>());

  const [lng] = useState(-38.632571);
  const [lat] = useState(25);
  const [zoom] = useState(zoomLevel);

  useEffect(() => {
    setSource(sourceData);
  }, [sourceData]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || loading || !source) return;

    if (!instance.getSource('servers')) {
      instance.addSource('servers', {
        type: 'geojson',
        dynamic: true,
        data: { ...source, features: [] },
      });
      instance.addLayer({
        id: 'servers-visualise',
        type: 'circle',
        source: 'servers',
        slot: 'top',
        paint: {
          'circle-color': '#2F7DEB',
          'circle-radius': 4,
          'circle-emissive-strength': 1,
        },
      });
    }
    const serverSource = instance.getSource<GeoJSONSource>('servers');

    const pendingFeatures = source.features
      .filter((f) => f.id !== undefined && !addedFeatureIds.current.has(f.id))
      .sort(() => Math.random() - 0.5);

    let appendMarkerTimer: ReturnType<typeof setTimeout>;
    const appendMarker = () => {
      const feature = pendingFeatures.shift();
      if (!feature || !serverSource) return;
      addedFeatureIds.current.add(feature.id!);
      serverSource.updateData({
        type: 'FeatureCollection',
        features: [feature],
      });
      appendMarkerTimer = setTimeout(appendMarker, Math.random() * 150);
    };

    appendMarker();

    return () => {
      clearTimeout(appendMarkerTimer);
    };
  }, [map, loading, source]);

  useEffect(() => {
    if (map.current || !ACCESS_TOKEN || !isWebGLSupported()) return;

    setLoading(true);

    const instance = new mapboxgl.Map({
      accessToken: ACCESS_TOKEN,
      container: mapContainer.current,
      style: MAP_STYLE,
      config: {
        basemap: {
          ...BASEMAP_CONFIG,
          lightPreset: THEMES[themeMode].lightPreset,
        },
      },
      projection: {
        name: 'mercator',
      },
      interactive: false,
      center: [lng, lat],
      zoom: zoom,
    });
    map.current = instance;

    instance.on('style.load', () => {
      addFlatBasemap(instance, themeMode);
      setLoading(false);
    });
  }, [lat, lng, themeMode, zoom]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || loading) return;
    const { lightPreset, water, land } = THEMES[themeMode];
    instance.setConfigProperty('basemap', 'lightPreset', lightPreset);
    instance.setPaintProperty('flat-water', 'fill-color', water);
    instance.setPaintProperty('flat-land', 'fill-color', land);
  }, [loading, themeMode]);

  useEffect(() => {
    const addedIds = addedFeatureIds.current;
    return () => {
      map.current?.remove();
      map.current = null;
      addedIds.clear();
    };
  }, []);

  return (
    <div className="rd__latencymap">
      <div ref={mapContainer} className="rd__latencymap-container" />
    </div>
  );
};

const isWebGLSupported = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!window.WebGL2RenderingContext && !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
};
