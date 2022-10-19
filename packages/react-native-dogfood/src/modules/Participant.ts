import {MediaStream} from 'react-native-webrtc';

export class Participant {
  name: string;
  mediaStream: MediaStream;
  audioMuted: boolean;
  videoDisabled: boolean;
  networkQuality: number;

  constructor(mediaStream: MediaStream, name: string, audioMuted = false) {
    this.name = name;
    this.mediaStream = mediaStream;
    this.audioMuted = audioMuted;
    this.videoDisabled = false;
    this.networkQuality = 100;
  }
}
