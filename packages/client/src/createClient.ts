import {
  TwirpFetchTransport,
  TwirpOptions,
} from '@protobuf-ts/twirp-transport';
import { CallCoordinatorServiceClient } from '../gen/video_coordinator_rpc/coordinator_service.client';

const defaultOptions: TwirpOptions = {
  baseUrl: '',
  sendJson: true,
};

export const createClient = (options?: TwirpOptions) => {
  const transport = new TwirpFetchTransport({
    ...defaultOptions,
    options,
  });

  return new CallCoordinatorServiceClient(transport);
};
