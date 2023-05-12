import HLS, { Level } from 'hls.js';
import { forwardRef, useEffect, useState } from 'react';
import {
  DurationBadge,
  HDBadge,
  LiveBadge,
  TotalViewersBadge,
} from '../../components';
import {
  IconButton,
  MenuToggle,
  ToggleMenuButtonProps,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';

import './ViewerHeader.scss';

export const ViewerHeader = (props: { hls?: HLS }) => {
  const { hls } = props;
  const [selectedLevel, setSelectedLevel] = useState<number>(0);
  const [levels, setLevels] = useState<Level[]>([]);
  useEffect(() => {
    if (!hls) return;
    const onLevelLoaded = () => {
      setLevels(hls.levels);
    };

    const onLevelUpdated = () => {
      setSelectedLevel(hls.currentLevel);
    };

    hls.on(HLS.Events.LEVEL_LOADED, onLevelLoaded);
    hls.on(HLS.Events.LEVEL_UPDATED, onLevelLoaded);
    return () => {
      hls.off(HLS.Events.LEVEL_LOADED, onLevelLoaded);
      hls.off(HLS.Events.LEVEL_UPDATED, onLevelUpdated);
    };
  }, [hls]);
  return (
    <div className="viewer-header">
      <div className="section left-section">
        <LiveBadge />
        <TotalViewersBadge />
      </div>
      <div className="section center-section">
        <DurationBadge />
      </div>
      <div className="section right-section">
        <MenuToggle placement="bottom-end" ToggleButton={SettingsButton}>
          <div className="quality-selector">
            <h2 className="quality-selector-title">Settings</h2>
            <div className="quality-selector-body">
              <h4>Select video quality</h4>
              {levels.map((level) => (
                <div className="quality-item" key={level.name}>
                  <input
                    id={`quality-${level.name}`}
                    type="radio"
                    name="quality"
                    value={level.id}
                    checked={selectedLevel === level.id}
                    onChange={() => {
                      if (hls && hls.currentLevel !== level.id) {
                        hls.loadLevel = level.id;
                        setSelectedLevel(level.id);
                      }
                    }}
                  />
                  <label
                    htmlFor={`quality-${level.name}`}
                    className="quality-label"
                  >
                    {level.name}
                    <HDBadge />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </MenuToggle>
      </div>
    </div>
  );
};

const SettingsButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  ({ menuShown }, ref) => (
    <IconButton
      className={clsx('str-video__device-settings__button', {
        'str-video__device-settings__button--active': menuShown,
      })}
      title="Select quality"
      icon="device-settings"
      ref={ref}
    />
  ),
);
