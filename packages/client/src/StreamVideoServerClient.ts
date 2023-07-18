import { StreamVideoClient } from './StreamVideoClient';
import {
  CreateCallTypeRequest,
  CreateCallTypeResponse,
  GetCallTypeResponse,
  ListCallTypeResponse,
  UpdateCallTypeRequest,
  UpdateCallTypeResponse,
} from './gen/coordinator';

export class StreamVideoServerClient extends StreamVideoClient {
  getCallTypes = () => {
    return this.streamClient.get<ListCallTypeResponse>('/calltypes');
  };

  getCallType = (name: string) => {
    return this.streamClient.get<GetCallTypeResponse>(`/calltypes/${name}`);
  };

  createCallType = (data: CreateCallTypeRequest) => {
    return this.streamClient.post<CreateCallTypeResponse>('/calltypes', data);
  };

  deleteCallType = (name: string) => {
    return this.streamClient.delete<void>(`/calltypes/${name}`);
  };

  updateCallType = (name: string, data: UpdateCallTypeRequest) => {
    return this.streamClient.put<UpdateCallTypeResponse>(
      `/calltypes/${name}`,
      data,
    );
  };
}
