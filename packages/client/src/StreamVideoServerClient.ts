import { StreamVideoClient } from './StreamVideoClient';
import { StreamClientOptions } from './coordinator/connection/types';
import {
  CreateCallTypeRequest,
  CreateCallTypeResponse,
  GetCallTypeResponse,
  ListCallTypeResponse,
  UpdateCallTypeRequest,
  UpdateCallTypeResponse,
} from './gen/coordinator';

/**
 * @deprecated Please use the `@stream-io/node-sdk` package instead.
 *
 * @see https://getstream.io/video/docs/api/
 */
export class StreamVideoServerClient extends StreamVideoClient {
  constructor(apiKey: string, options: StreamClientOptions) {
    super({ apiKey, options });
  }

  /**
   * createToken - Creates a token to authenticate this user. This function is used server side.
   * The resulting token should be passed to the client side when the users register or logs in.
   *
   * @param {string} userID The User ID
   * @param {number} [exp] The expiration time for the token expressed in the number of seconds since the epoch
   * @param {number} [iat] The timestamp when a token has been issued
   * @param call_cids for anonymous tokens you have to provide the call cids the use can join
   *
   * @return {string} Returns a token
   */
  createToken(
    userID: string,
    exp?: number,
    iat?: number,
    call_cids?: string[],
  ) {
    return this.streamClient.createToken(userID, exp, iat, call_cids);
  }

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
