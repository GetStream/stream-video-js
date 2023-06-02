const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const tokenProviderURL = import.meta.env.VITE_TOKEN_PROVIDER_URL;

export async function tokenProvider(userId: string): Promise<string> {
  if (!apiKey) {
    throw new Error('Missing VITE_STREAM_API_KEY');
  }
  if (!tokenProviderURL) {
    throw new Error('Missing VITE_TOKEN_PROVIDER_URL');
  }
  const url = new URL(tokenProviderURL);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('user_id', userId);
  const response = await fetch(url.toString());
  const { token } = await response.json();
  return token;
}
