import { LogLevel } from '@stream-io/video-react-sdk';

type URLCredentials = {
  id?: string;
  type?: string;
  user_name?: string;
  user_id?: string;
  token?: string;
  api_key?: string;
  qr?: string;
  log_level?: LogLevel;
};

export const getURLCredentials = (): URLCredentials => {
  return typeof window !== 'undefined'
    ? (new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, property) => searchParams.get(property as string),
      }) as URLCredentials)
    : {};
};
