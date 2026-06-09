const CALL_ID_PARAM = 'call_id';

export const resolveCallId = (search: string): string => {
  const fromUrl = new URLSearchParams(search).get(CALL_ID_PARAM);
  return fromUrl || `e2ee-demo-${crypto.randomUUID().slice(0, 8)}`;
};

/** Reflect the call id in the URL so the harness is bookmarkable and shareable. */
export const writeUrl = (callId: string): void => {
  const url = new URL(window.location.href);
  url.searchParams.set(CALL_ID_PARAM, callId);
  window.history.replaceState(null, '', url);
};
