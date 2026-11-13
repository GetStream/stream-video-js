require('dotenv').config();

const tokenProviderURL =
  process.env.VITE_TOKEN_PROVIDER_URL ||
  'https://pronto.getstream.io/api/auth/create-token';
const environment = process.env.VITE_STREAM_ENVIRONMENT || 'demo';

/**
 * Fetches a user token from the pronto token provider. Extra `claims` are
 * forwarded as query parameters and end up in the token payload.
 *
 * @returns {Promise<{ apiKey: string, token: string }>}
 */
const createToken = async (userId, claims = {}) => {
  const url = new URL(tokenProviderURL);
  url.searchParams.set('user_id', userId);
  url.searchParams.set('environment', environment);
  for (const [key, value] of Object.entries(claims)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Token request for "${userId}" failed: ${response.status} ${await response.text()}`,
    );
  }
  const { apiKey, token } = await response.json();
  return { apiKey, token };
};

module.exports = { createToken };
