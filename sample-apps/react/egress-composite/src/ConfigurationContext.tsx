import { PropsWithChildren, createContext, useContext, useMemo } from 'react';
import { decode } from 'js-base64';
import queryString from 'qs';

import { DEFAULT_LAYOUT_ID, LayoutType, SpotlightMode } from './layouts';
import { CSSProperties } from 'react';

const DEFAULT_USER_ID = 'egress';
const DEFAULT_CALL_TYPE = 'default';

export type ConfigurationValue = {
  base_url?: string;
  api_key: string;
  token: string;
  user_id: string;
  call_id: string;
  call_type: string;

  // TODO: implement
  fontFamily?: string;

  layout: {
    type: LayoutType;
    spotlightMode: SpotlightMode;
    gridSize: number;
  };
  title?: {
    text?: string;
    style?: CSSProperties;
  };
  logo?: {
    url?: string;
    style?: CSSProperties;
  };
  background?: {
    style: CSSProperties;
  };
};

const ConfigurationContext = createContext<ConfigurationValue>(
  {} as ConfigurationValue,
);

const extractPayloadFromToken = (token: string) => {
  const [, payload] = token.split('.');

  if (!payload) throw new Error('Malformed token, missing payload');

  return (JSON.parse(decode(payload)) ?? {}) as Record<string, unknown>;
};

export const useConfigurationContext = () => useContext(ConfigurationContext);

export const ConfigurationContextProvider = ({
  children,
}: PropsWithChildren) => {
  const value = useMemo<ConfigurationValue>(() => {
    // apply crucial defaults
    const {
      // TODO: rename these to support camelCase
      api_key = import.meta.env.VITE_STREAM_API_KEY,
      token = import.meta.env.VITE_STREAM_USER_TOKEN,
      user_id = DEFAULT_USER_ID,
      call_type = DEFAULT_CALL_TYPE,

      layout = {
        type: DEFAULT_LAYOUT_ID,
        spotlightMode: DEFAULT_LAYOUT_ID,
        gridSize: 25,
      },
      ...rest
    } = queryString.parse(window.location.search, {
      allowDots: true,
      comma: true,
      ignoreQueryPrefix: true,
    });

    if (!api_key || !token)
      throw new Error(
        "Missing either 'api_key' or 'token', check either your .env file or search parameters",
      );

    // @ts-expect-error
    layout.type ??= DEFAULT_LAYOUT_ID;
    // @ts-expect-error
    layout.spotlightMode ??= DEFAULT_LAYOUT_ID;
    // @ts-expect-error
    layout.gridSize ??= 25;

    return {
      api_key,
      token,
      user_id: extractPayloadFromToken(token as string).user_id || user_id,
      call_type,
      layout,

      ...rest,
    } as unknown as ConfigurationValue;
  }, []);

  console.log('<debug>', { value });

  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
};
