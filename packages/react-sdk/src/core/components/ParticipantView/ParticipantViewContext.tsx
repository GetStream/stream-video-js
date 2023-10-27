import { createContext, useContext } from 'react';
import { ParticipantViewProps } from './ParticipantView';

export type ParticipantViewContextValue = Required<
  Pick<ParticipantViewProps, 'participant' | 'trackType'>
> & {
  participantViewElement: HTMLDivElement | null;
  videoElement: HTMLVideoElement | null;
  videoPlaceholderElement: HTMLDivElement | null;
};

export const ParticipantViewContext = createContext<
  ParticipantViewContextValue | undefined
>(undefined);

export const useParticipantViewContext = () =>
  useContext(ParticipantViewContext) as ParticipantViewContextValue;
