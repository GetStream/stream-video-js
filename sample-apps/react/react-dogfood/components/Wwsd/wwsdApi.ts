import type { JoinLink } from './types';

export class WwsdApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const readDetail = async (res: Response) => {
  try {
    const body = await res.json();
    const detail = body?.detail;
    if (typeof detail === 'string') return detail;
    if (detail) return JSON.stringify(detail);
  } catch {
    // the body was not JSON
  }
  return `${res.status} ${res.statusText}`;
};

export const createWwsdApi = (baseUrl: string, callId: string) => {
  const callUrl = (path: string) =>
    `${baseUrl}/calls/${encodeURIComponent(callId)}${path}`;

  const post = async <T = unknown>(path: string, body?: unknown) => {
    const res = await fetch(callUrl(path), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) throw new WwsdApiError(res.status, await readDetail(res));
    return (await res.json()) as T;
  };

  return {
    eventsUrl: callUrl('/events').replace(/^http/, 'ws'),
    links: () => post<JoinLink[]>('/links'),
    listen: () => post<{ listening: boolean }>('/listen'),
    runPersona: (personaId: string, speak: boolean) =>
      post(`/personas/${encodeURIComponent(personaId)}/run`, { speak }),
    draftChatQuestion: () =>
      post<{ draft: string }>('/ask-chat-team', { send: false }),
    sendChatQuestion: (draft: string) =>
      post('/ask-chat-team', { send: true, draft }),
    startFixItLive: () => post('/eng-workflow'),
    approveFix: () => post('/eng-workflow/approve'),
    recap: () => post('/recap'),
    postRecapToSlack: (markdown: string) =>
      post<{ permalink: string }>('/recap/slack', { markdown }),
    createFollowupTask: () => post('/recap/linear'),
    reset: () => post('/reset'),
    autoplay: (scenario: string) =>
      post('/autoplay', scenario ? { scenario } : {}),
  };
};

export type WwsdApi = ReturnType<typeof createWwsdApi>;

export const describeWwsdError = (err: unknown, baseUrl: string) => {
  if (err instanceof WwsdApiError) return err.message;
  if (err instanceof TypeError) {
    return `Backend unreachable at ${baseUrl}: on VPN?`;
  }
  return err instanceof Error ? err.message : String(err);
};
