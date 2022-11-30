import {
  CallAccepted,
  CallCreated,
} from '../gen/video/coordinator/event_v1/event';
import { Call as CallController } from '../rtc/Call';

export type ActiveCall = {
  data?: CallCreated | CallAccepted;
  connection?: CallController;
};
