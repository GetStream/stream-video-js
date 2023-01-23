import {
  FC,
  useMemo,
  useRef,
  useState,
  useEffect,
  SetStateAction,
  Dispatch,
} from 'react';
import mapboxgl, { GeoJSONSource, GeoJSONSourceRaw, Popup } from 'mapbox-gl';
import { FeatureCollection, Geometry, AnySourceImpl } from 'geojson';

import styles from './LatencyMap.module.scss';

export type Props = {
  sourceData: FeatureCollection<Geometry>;
  zoomLevel?: number;
};

export const LatencyMap: FC<Props> = ({ sourceData, zoomLevel = 1 }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [source, setSource] = useState(sourceData);
  const [properties, setProperties] = useState();
  const [popup, setPopup]: [
    Popup | undefined,
    Dispatch<SetStateAction<Popup | undefined>>,
  ] = useState();

  const mapContainer = useRef<any>(undefined);
  const map = useRef<mapboxgl.Map | null>(null);

  const [lng, setLng] = useState(39);
  const [lat, setLat] = useState(34);
  const [zoom, setZoom] = useState(zoomLevel);

  useEffect(() => {
    setSource(sourceData);
  }, [sourceData]);

  useEffect(() => {
    if (map.current && !loading) {
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });
      setPopup(popup);
    }
  }, [loading, map]);

  useEffect(() => {
    if (map.current && !loading) {
      map.current.on('mouseenter', 'servers-visualise', (e: any) => {
        if (map.current) {
          if (e.features) {
            const [point] = e.features;
            const properties: any = point.properties;
            setProperties(properties);
            console.log(point);

            if (popup) {
              const coordinates = point.geometry.coordinates.slice();
              const name = point.properties.name;

              console.log(coordinates);

              popup
                .setLngLat(coordinates)
                .setHTML(name)
                .on('open', (e) => {
                  console.log('It is open');
                })
                .addTo(map.current);
              console.log(popup);
            }
          }
        }
      });
    }
  }, [loading, map, popup]);

  useEffect(() => {
    if (map.current && !loading) {
      map.current.on('mouseleave', 'servers-visualise', (e: any) => {
        if (map.current && popup) {
          // popup.remove();
        }
      });
    }
  }, [loading, map, popup]);

  useEffect(() => {
    let appendMarkerTimer: ReturnType<typeof setTimeout>;

    if (map.current && !loading) {
      const [firstFeature, ...lazyloadFeatures] = source.features.sort(
        () => Math.random() - 0.5,
      );

      map.current.addSource('servers', {
        type: 'geojson',
        data: {
          ...source,
          features: [firstFeature],
        },
      });

      if (map.current.getSource('servers')) {
        const source: any = map.current.getSource('servers');

        lazyloadFeatures.forEach((feature, index) => {
          appendMarkerTimer = setTimeout(() => {
            if (map.current) {
              source.setData({
                type: 'FeatureCollection',
                features: [...lazyloadFeatures.slice(0, index + 1), feature],
              });
            }
          }, index * (Math.random() * (2500 - 1000) + 1000));
        });
      }
    }

    return () => {
      clearTimeout(appendMarkerTimer);
    };
  }, [map, loading, source]);

  useEffect(() => {
    if (map.current && !loading) {
      map.current.addLayer({
        id: 'servers-visualise',
        type: 'circle',
        source: 'servers',
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 4,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        },
      });
    }
  }, [map, loading]);

  useEffect(() => {
    if (map.current) return;

    setLoading(true);

    mapboxgl.accessToken =
      'pk.eyJ1IjoiendhYXJkamUiLCJhIjoiY2thMTVmZXp1MGl3djNmbjZrZWFkemxrNiJ9.dk3iMrfG8ZXwKK8m4WyvfA';

    map.current = new mapboxgl.Map({
      projection: {
        name: 'mercator',
      },
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.on('load', () => {
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div ref={mapContainer} className={styles.container} />
    </div>
  );
};
