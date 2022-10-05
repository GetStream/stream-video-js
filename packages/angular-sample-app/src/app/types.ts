import { VideoDimension } from "@stream-io/video-client/dist/src/gen/video/sfu/models_v1/models";

export type CallParticipant = {name: string, audio?: MediaStream, video?: MediaStream, isLoggedInUser: boolean, videoDimension?: VideoDimension};
