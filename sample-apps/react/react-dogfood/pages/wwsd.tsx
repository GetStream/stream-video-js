import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  createWwsdApi,
  describeWwsdError,
  normalizeBackendUrl,
  resolveBackendUrl,
  storeCustomerLink,
  toLocalJoinPath,
  WwsdApi,
  WwsdApiError,
} from '../components/Wwsd';

type Busy = 'start' | 'reset' | 'autoplay' | null;

export default function WwsdStartPage() {
  const router = useRouter();
  const [backendUrl, setBackendUrl] = useState('');
  const [callId, setCallId] = useState('demo');
  const [scenario, setScenario] = useState('');
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<string | null>(null);

  const override =
    typeof router.query['wwsd_url'] === 'string'
      ? router.query['wwsd_url']
      : undefined;
  useEffect(() => {
    if (!router.isReady) return;
    setBackendUrl(resolveBackendUrl(override));
  }, [router.isReady, override]);

  const withApi = async (
    kind: Exclude<Busy, null>,
    fn: (api: WwsdApi, id: string) => Promise<void>,
  ) => {
    const url = normalizeBackendUrl(backendUrl);
    const id = callId.trim();
    if (!url || !id) {
      setMessage('Set the backend URL and a call id.');
      return;
    }
    resolveBackendUrl(url);
    setBusy(kind);
    setMessage(null);
    try {
      await fn(createWwsdApi(url, id), id);
    } catch (err) {
      setMessage(describeWwsdError(err, url));
    } finally {
      setBusy(null);
    }
  };

  const startCall = () =>
    withApi('start', async (api, id) => {
      const links = await api.links().catch((err) => {
        if (err instanceof WwsdApiError && err.status === 503) {
          throw new Error(
            'Backend has no Stream credentials (503 from /links).',
          );
        }
        throw err;
      });
      const rep = links.find((link) => link.role === 'rep');
      const customer = links.find((link) => link.role === 'customer');
      if (!rep || !customer) {
        throw new Error('The backend returned no rep or customer link.');
      }
      storeCustomerLink(id, customer.url);
      // A full navigation: /join's getServerSideProps may have to sign in first, and a
      // client-side push would land on its JSON data URL after that.
      window.location.assign(toLocalJoinPath(rep, id));
    });

  const resetCall = () =>
    withApi('reset', async (api) => {
      await api.reset();
      setMessage('Call reset: history cleared, copilot stopped.');
    });

  const autoplay = () =>
    withApi('autoplay', async (api) => {
      await api.autoplay(scenario.trim());
      setMessage('Autoplay started. Open the call to watch the cards.');
    });

  return (
    <div className="rd__wwsd-start">
      <div className="rd__wwsd-start__content">
        <h1 className="rd__wwsd-start__title">WWSD: What Would Stream Do</h1>
        <p className="rd__wwsd-start__subtitle">
          Start a call with the copilot listening. The customer joins from the
          link in the copilot panel.
        </p>

        <label className="rd__wwsd-start__label">
          Backend URL
          <input
            className="rd__input"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            placeholder="http://localhost:8000"
          />
        </label>
        <label className="rd__wwsd-start__label">
          Call id
          <input
            className="rd__input"
            value={callId}
            onChange={(e) => setCallId(e.target.value)}
          />
        </label>

        <button
          className="rd__button rd__button--primary rd__button--large"
          disabled={busy !== null}
          onClick={startCall}
        >
          {busy === 'start' ? 'Starting...' : 'Start call'}
        </button>

        <div className="rd__wwsd-start__rehearsal">
          <h2>Rehearsal</h2>
          <div className="rd__wwsd-start__row">
            <button
              className="rd__button rd__button--secondary"
              disabled={busy !== null}
              onClick={resetCall}
            >
              Reset call
            </button>
            <input
              className="rd__input"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="scenario (empty = support, or sales)"
            />
            <button
              className="rd__button rd__button--secondary"
              disabled={busy !== null}
              onClick={autoplay}
            >
              Autoplay
            </button>
          </div>
        </div>

        {message && <p className="rd__wwsd-start__message">{message}</p>}
      </div>
    </div>
  );
}
