import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import {
  CallDiagnostics,
  CallDiagnosticsParticipant,
} from '../../components/CallDiagnostics';
import { DefaultAppHeader } from '../../components/DefaultAppHeader';
import { useAppEnvironment } from '../../context/AppEnvironmentContext';
import { getClient } from '../../helpers/client';
import {
  getServerSideCredentialsProps,
  ServerSideCredentialsProps,
} from '../../lib/getServerSideCredentialsProps';

const participantRefreshInterval = 5000;

export default function DebugCall(props: ServerSideCredentialsProps) {
  const { apiKey, user, userToken } = props;
  const environment = useAppEnvironment();
  const router = useRouter();
  const cid = typeof router.query.cid === 'string' ? router.query.cid : '';
  const appId = Number(router.query.app_id);
  const callSessionId =
    typeof router.query.call_session_id === 'string'
      ? router.query.call_session_id
      : '';
  const [participants, setParticipants] = useState<
    CallDiagnosticsParticipant[]
  >([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    if (!cid || !callSessionId || !Number.isFinite(appId) || appId <= 0) {
      setError('The call diagnostics link is invalid.');
      return;
    }
    const separator = cid.indexOf(':');
    if (separator < 1 || separator === cid.length - 1) {
      setError(`Invalid call CID: ${cid}`);
      return;
    }

    const callType = cid.slice(0, separator);
    const callId = cid.slice(separator + 1);
    const useLocalCoordinator = router.query.use_local_coordinator === 'true';
    const coordinatorUrl = useLocalCoordinator
      ? 'http://localhost:3030'
      : typeof router.query.coordinator_url === 'string'
        ? router.query.coordinator_url
        : undefined;
    const client = getClient(
      { apiKey, user, userToken, coordinatorUrl },
      environment,
    );
    const call = client.call(callType, callId, { reuseInstance: true });
    let cancelled = false;

    const refreshParticipants = async () => {
      try {
        await call.get();
        if (cancelled) return;
        const session = call.state.session;
        if (!session || session.id !== callSessionId) {
          setError('The selected call session is no longer active.');
          return;
        }
        const next = session.participants.map((participant) => ({
          userId: participant.user.id,
          userSessionId: participant.user_session_id,
          name: participant.user.name,
        }));
        setParticipants((current) =>
          participantSignature(current) === participantSignature(next)
            ? current
            : next,
        );
        setError(undefined);
      } catch (refreshError) {
        if (!cancelled) {
          setError(
            refreshError instanceof Error
              ? refreshError.message
              : 'Failed to load call participants',
          );
        }
      }
    };

    refreshParticipants().catch(console.error);
    const interval = window.setInterval(
      () => refreshParticipants().catch(console.error),
      participantRefreshInterval,
    );
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      client
        .disconnectUser()
        .catch((disconnectError) =>
          console.error(
            'Failed to disconnect diagnostics client',
            disconnectError,
          ),
        );
    };
  }, [
    apiKey,
    appId,
    callSessionId,
    cid,
    environment,
    router.isReady,
    router.query.coordinator_url,
    router.query.use_local_coordinator,
    user,
    userToken,
  ]);

  if (!router.isReady) return null;

  return (
    <>
      <DefaultAppHeader />
      {error && participants.length === 0 ? (
        <main className="rd__call-diagnostics rd__call-diagnostics--empty">
          <h1>Call diagnostics unavailable</h1>
          <p>{error}</p>
        </main>
      ) : participants.length === 0 ? (
        <main className="rd__call-diagnostics rd__call-diagnostics--empty">
          <h1>Loading call participants…</h1>
        </main>
      ) : (
        <CallDiagnostics
          appId={appId}
          callCID={cid}
          callSessionId={callSessionId}
          participants={participants}
        />
      )}
    </>
  );
}

const participantSignature = (participants: CallDiagnosticsParticipant[]) =>
  participants
    .map(({ userId, userSessionId }) => `${userId}:${userSessionId}`)
    .sort()
    .join('|');

export const getServerSideProps = getServerSideCredentialsProps;
