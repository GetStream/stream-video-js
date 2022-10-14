import {MediaStream} from 'react-native-webrtc';

import {VideoLayer} from '../../gen/sfu_models/models';

export const findOptimalVideoLayers = async (mediaStream: MediaStream) => {
  //  width, height, maxBitrate
  const steps: [number, number, number][] = [
    // [4096, 2160, 13000000], // 4K
    [1920, 1080, 1900000], // 1080p // FHD
    [1280, 720, 1200000], // 720p // HD
    [854, 480, 500000], // 480p
    [640, 360, 400000], // 360p
    [426, 240, 300000], // 240p
  ];

  const optimalVideoLayers: VideoLayer[] = [];
  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const [w, h] = steps[stepIndex];
    const [videoTrack] = mediaStream.getVideoTracks();
    const settings = videoTrack.getSettings() as {
      frameRate: number;
      width: number;
      height: number;
    };

    // found ideal layer
    if (w === settings.width && h === settings.height) {
      ['f', 'h', 'q'].forEach((rid, i) => {
        const step = steps[stepIndex + i];
        if (step) {
          const [width, height, bitrate] = step;
          optimalVideoLayers.push({
            rid,
            videoDimension: {
              width,
              height,
            },
            bitrate,
          });
        }
      });

      break;
    }
  }
  return optimalVideoLayers;
};

export const DEFAULT_VIDEO_LAYERS: VideoLayer[] = [
  {
    rid: 'f',
    bitrate: 1000000,
    videoDimension: {
      width: 1280,
      height: 720,
    },
  },
  {
    rid: 'h',
    bitrate: 500000,
    videoDimension: {
      width: 640,
      height: 480,
    },
  },
  {
    rid: 'q',
    bitrate: 300000,
    videoDimension: {
      width: 480,
      height: 360,
    },
  },
];
