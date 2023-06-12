import { Call } from '@stream-io/video-react-sdk';
import { User } from './users';

export type CustomCallData = {
  title?: string;
  subtitle?: string;
  hosts?: User[];
  speakerIds?: string[];
  description?: string;
};

export type AudioRoom = {
  id: string;
  isBackstage: boolean;
  listeners: User[];
  call?: Call;
} & CustomCallData;
