const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;
const url = 'https://stream-calls-dogfood.vercel.app/api/auth/create-token?';

export async function tokenProvider(userId: string): Promise<string> {
  const constructedUrl = constructUrl(userId);
  const response = await fetch(constructedUrl);
  const resultObject = await response.json();
  let token = resultObject.token;
  return token;
}

function constructUrl(userId: string): string {
  return (
    url +
    new URLSearchParams({
      api_key: apiKey,
      user_id: userId,
    })
  );
}
