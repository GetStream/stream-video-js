import { Participant, VideoDimension } from '../gen/video/sfu/models/models';

export type StreamVideoParticipant = {
  videoTrack?: MediaStream;
  audioTrack?: MediaStream;
  videoDimension?: VideoDimension;
  isLoggedInUser?: boolean;
} & Participant;

export type VideoDimensionChange = {
  participant: StreamVideoParticipant;
  videoDimension: VideoDimension;
};
