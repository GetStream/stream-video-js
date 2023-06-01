import { Call } from '@stream-io/video-client';
import { User } from './users';

export interface AudioRoom {
  id: string;
  title: string;
  subtitle: string;
  hosts: User[];
  listeners: User[];
  speakers: User[];
  call?: Call;
}

export function roomFromCall(call: Call): AudioRoom {
  const customData = call.data?.custom;
  return {
    id: call.id,
    title: customData?.title,
    subtitle: customData?.description,
    hosts: customData?.hosts,
    listeners: [],
    speakers: [],
    call: call,
  };
}
