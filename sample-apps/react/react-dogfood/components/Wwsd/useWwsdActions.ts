import { useEffect, useState } from 'react';
import { readCustomerLink, storeCustomerLink } from './config';
import { describeWwsdError, WwsdApi, WwsdApiError } from './wwsdApi';

export type ListenStatus = 'joining' | 'listening' | 'failed';

export const useWwsdActions = (
  api: WwsdApi,
  backendUrl: string,
  callId: string,
) => {
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [listenStatus, setListenStatus] = useState<ListenStatus>('joining');

  const run = async <T>(name: string, fn: () => Promise<T>) => {
    setPending((p) => ({ ...p, [name]: true }));
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(describeWwsdError(err, backendUrl));
      return undefined;
    } finally {
      setPending((p) => ({ ...p, [name]: false }));
    }
  };

  // The copilot joins the call as soon as the panel mounts. /listen is idempotent.
  useEffect(() => {
    let cancelled = false;
    api.listen().then(
      () => {
        if (!cancelled) setListenStatus('listening');
      },
      (err) => {
        if (cancelled) return;
        setListenStatus('failed');
        setError(describeWwsdError(err, backendUrl));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, backendUrl]);

  const retryListen = async () => {
    setListenStatus('joining');
    const result = await run('listen', api.listen);
    setListenStatus(result ? 'listening' : 'failed');
  };

  const fetchCustomerLink = async () => {
    const stored = readCustomerLink(callId);
    if (stored) return stored;
    const links = await run('links', api.links);
    const customer = links?.find((link) => link.role === 'customer');
    if (customer) storeCustomerLink(callId, customer.url);
    return customer?.url;
  };

  const actions = {
    retryListen,
    fetchCustomerLink,
    runPersona: (personaId: string, speak: boolean) =>
      run(`persona:${personaId}`, () => api.runPersona(personaId, speak)),
    draftChatQuestion: () => run('draftChatQuestion', api.draftChatQuestion),
    sendChatQuestion: (draft: string) =>
      run('sendChatQuestion', () => api.sendChatQuestion(draft)),
    startFixItLive: () =>
      run('fixItLive', () =>
        api.startFixItLive().catch((err) => {
          // 409: a run is already in progress, which is fine
          if (err instanceof WwsdApiError && err.status === 409) return null;
          throw err;
        }),
      ),
    approveFix: () => run('approveFix', api.approveFix),
    requestRecap: () => run('recap', api.recap),
    postRecapToSlack: async (markdown: string) => {
      const result = await run('recapSlack', () =>
        api.postRecapToSlack(markdown),
      );
      return result?.permalink;
    },
    createFollowupTask: () => run('followupTask', api.createFollowupTask),
  };

  return {
    actions,
    pending,
    error,
    clearError: () => setError(null),
    listenStatus,
  };
};

export type WwsdActions = ReturnType<typeof useWwsdActions>['actions'];
