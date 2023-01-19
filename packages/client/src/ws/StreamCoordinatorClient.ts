import axios from 'axios';
import { StableWSConnection } from './connection/StableWsConnection';

export class StreamCoordinatorClient {
  wsConnection = new StableWSConnection();

  connect = async () => {
    await this.wsConnection.connect();
  };

  getOrCreateCall = async (id: string, type: string) => {
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));
    await axios.post(
      `http://localhost:3030/video/call/${type}/${id}`,
      {
        id,
        type,
        ring: true,
        data: {
          // id: `${Math.round(Math.random() * 1000)}`,
          // type: 'default',
          team: 'alpha',
          members: [{ user_id: 'ol', user: { id: 'ol' } }],
        },
      },
      {
        params: {
          connection_id: this.wsConnection.connectionID,
          user_id: 'ol',
          api_key: '892s22ypvt6m',
        },
        headers: {
          Authorization: `${this.wsConnection.token}`,
          'stream-auth-type': 'jwt',
        },
      },
    );
  };

  joinCall = async (id: string, type: string) => {
    return await axios.post(
      `http://localhost:3030/video/join_call/${type}/${id}`,
      {
        id,
        type,
        ring: true,
        data: {
          // id: `${Math.round(Math.random() * 1000)}`,
          // type: 'default',
          team: 'alpha',
          members: [],
        },
      },
      {
        params: {
          connection_id: this.wsConnection.connectionID,
          user_id: 'ol',
          api_key: '892s22ypvt6m',
        },
        headers: {
          Authorization: `${this.wsConnection.token}`,
          'stream-auth-type': 'jwt',
        },
      },
    );
  };
}
