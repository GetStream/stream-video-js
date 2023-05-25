type ParamsType = {
  user_id: string;
  call_cids?: string;
};

export const createToken = async (params: ParamsType) => {
  const apiKey = process.env.STREAM_API_KEY as string;
  const baseURL = 'https://stream-calls-dogfood.vercel.app/api';
  const response = await fetch(
    `${baseURL}/auth/create-token?` +
      new URLSearchParams({ api_key: apiKey, ...params }),
    {},
  );
  const { token } = await response.json();
  return token;
};
