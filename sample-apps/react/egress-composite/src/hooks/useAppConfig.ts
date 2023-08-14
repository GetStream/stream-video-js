import { decode } from 'js-base64';
import { useMemo } from 'react';
import { DEFAULT_LAYOUT_ID, LayoutId } from '../layouts';

export type AppConfig = {
  baseURL?: string;
  apiKey: string;
  token: string;
  userId: string;
  callId: string;
  callType: string;
  layout: LayoutId;
  gridSize: number;
  extCSS: string;
};

export function appConfig() {
  const urlParams = new URLSearchParams(window.location.search);
  const apiKey = urlParams.get('api_key') || import.meta.env.VITE_STREAM_API_KEY;
  const token = urlParams.get('token') || import.meta.env.VITE_STREAM_TOKEN;
  const payload = JSON.parse(decode(token.split('.')[1]));
  const layout = (urlParams.get('layout') as LayoutId) || DEFAULT_LAYOUT_ID;
  const gridSize = Number(urlParams.get('grid.size')) || 25;
  const userId = payload!['user_id'] || "";
  const extCSS = urlParams.get("ext_css") || "";

  return {
    apiKey: apiKey,
    token: token,
    userId: userId,
    callId: urlParams.get('call_id')! || 'egress-test',
    callType: urlParams.get('call_type')! || 'default',
    baseURL: urlParams.get('base_url')!,
    layout: layout,
    gridSize: gridSize,
    extCSS: extCSS,
  };
}

export const useAppConfig = () => {
  const query = window.location.search;
  return useMemo<AppConfig>(() => {
    return appConfig();
  }, [query]);
};
