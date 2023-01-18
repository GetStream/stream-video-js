import axios from 'axios';
import { StableWSConnection } from './connection/StableWsConnection';

export class StreamCoordinatorClient {
  wsConnection = new StableWSConnection();

  connect = async () => {
    await this.wsConnection.connect();
    // this.wsConnection.ws?.send(
    //   JSON.stringify({
    //     token:
    //       'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoib2wiLCJleHAiOjE2NzQ5MzgwNTN9.DH5fhvOT4A0K4sWnRaORMDDoKi9af8PqRagEj53UQLk',
    //     user_details: {
    //       id: 'ol',
    //       name: 'ol',
    //       username: 'ol',
    //     },
    //   }),
    // );
  };

  getOrCreateCall = async (id: string, type: string) => {
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
