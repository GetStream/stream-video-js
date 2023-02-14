import { FC, useRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';
import { FeatureCollection, Geometry } from 'geojson';
import classnames from 'classnames';

import LatencyMapPopup from '../LatencyMapPopup';

import styles from './LatencyMap.module.css';

export type Props = {
  sourceData: FeatureCollection<Geometry>;
  zoomLevel?: number;
  className?: string;
};

export const LatencyMap: FC<Props> = ({
  className,
  sourceData,
  zoomLevel = 1,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [source, setSource] = useState(sourceData);

  const popUpRef = useRef(
    new mapboxgl.Popup({ offset: 15, closeButton: false, closeOnClick: false }),
  );

  const mapContainer = useRef<any>(undefined);
  const map = useRef<mapboxgl.Map | null>(null);

  const [lng, setLng] = useState(39);
  const [lat, setLat] = useState(34);
  const [zoom, setZoom] = useState(zoomLevel);

  const [hoverId, setHoverId] = useState(undefined);

  useEffect(() => {
    setSource(sourceData);
  }, [sourceData]);

  useEffect(() => {
    if (map.current && !loading) {
      map.current.on('mouseenter', 'servers-visualise', (e: any) => {
        if (map.current) {
          if (e.features?.length > 0) {
            const [point] = e.features;

            map.current.getCanvas().style.cursor = 'pointer';

            if (hoverId === undefined) {
              map.current.setFeatureState(
                {
                  source: 'servers',
                  id: point.id,
                },
                { hover: true },
              );

              setHoverId(point.id);
            }

            if (popUpRef && popUpRef.current) {
              const coordinates = point.geometry.coordinates.slice();

              const popupNode = document.createElement('div');

              const root = createRoot(popupNode!);
              root.render(
                <LatencyMapPopup
                  city={point.properties.city}
                  countryCode={point.properties.countryCode}
                  abbriviation={point.properties.abbriviation}
                />,
              );
              popUpRef.current
                .setLngLat(coordinates)
                .setDOMContent(popupNode)
                .addTo(map.current);
            }
          }
        }
      });
    }
  }, [loading, map, popUpRef, hoverId]);

  useEffect(() => {
    if (map.current && !loading) {
      map.current.on('mouseleave', 'servers-visualise', (e: any) => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';

          if (hoverId) {
            map.current.setFeatureState(
              {
                source: 'servers',
                id: hoverId,
              },
              { hover: false },
            );
            setHoverId(undefined);
          }

          if (popUpRef && popUpRef.current) {
            popUpRef.current.remove();
          }
        }
      });
    }
  }, [loading, map, hoverId, popUpRef]);

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
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#20E070',
            '#2F7DEB',
          ],
          'circle-radius': 4,
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            8,
            0,
          ],
          'circle-stroke-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            'rgba(30, 177, 20, 0.2)',
            'transparent',
          ],
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
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.on('load', () => {
      setLoading(false);
    });
  }, []);

  const rootClassName = classnames(styles.root, className);

  return (
    <div>
      <div ref={mapContainer} className={rootClassName} />
    </div>
  );
};
