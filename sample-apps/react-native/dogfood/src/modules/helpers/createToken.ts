import { STREAM_API_KEY } from '../../../config';

type ParamsType = {
  user_id: string;
  call_cids?: string;
};

export const createToken = async (params: ParamsType) => {
  const endpoint = new URL(
    'https://stream-calls-dogfood.vercel.app/api/auth/create-token',
  );
  endpoint.searchParams.set('api_key', STREAM_API_KEY);
  endpoint.searchParams.set('user_id', params.user_id);
  endpoint.searchParams.set('exp', String(4 * 60 * 60)); // 4 hours
  if (params.call_cids) {
    endpoint.searchParams.set('call_cids', params.call_cids);
  }
  const response = await fetch(endpoint.toString()).then((res) => res.json());
  return response.token as string;
};
