import { ENVIRONMENT } from '@env';

type ParamsType = {
  user_id: string;
  call_cids?: string;
};

export const createToken = async (params: ParamsType) => {
  const endpoint = new URL('https://pronto.getstream.io/api/auth/create-token');
  endpoint.searchParams.set('user_id', params.user_id);
  endpoint.searchParams.set('environment', ENVIRONMENT);
  endpoint.searchParams.set('exp', String(4 * 60 * 60)); // 4 hours
  if (params.call_cids) {
    endpoint.searchParams.set('call_cids', params.call_cids);
  }
  const response = await fetch(endpoint.toString()).then((res) => res.json());
  return {
    token: response.token as string,
    apiKey: response.apiKey as string,
  };
};
