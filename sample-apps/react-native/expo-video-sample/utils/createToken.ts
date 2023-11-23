type ParamsType = {
  user_id: string;
  call_cids?: string;
};

type EnvironmentType = 'pronto' | 'demo';

export const createToken = async (
  params: ParamsType,
  environment: EnvironmentType = 'pronto',
) => {
  const endpoint = new URL('https://pronto.getstream.io/api/auth/create-token');
  endpoint.searchParams.set('user_id', params.user_id);
  endpoint.searchParams.set('environment', environment);
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
