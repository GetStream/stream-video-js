import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { useRouter } from 'next/router';
import { DefaultAppHeader } from '../../components/DefaultAppHeader';
import { FormEvent, useState } from 'react';
import { JwtTokenGenerator } from '../../lib/jwt';
import { LatencyMap } from '../../components/LatencyMap/LatencyMap';
import { useEdges } from '../../hooks/useEdges';

export default function LivestreamSetupPage() {
  const [apiKey, setApiKey] = useState('');
  const [secret, setSecret] = useState('');
  const [callType, setCallType] = useState('livestream');
  const [callId, setCallId] = useState('');
  const [userId, setUserId] = useState('livestream-demo-user');
  const [error, setError] = useState('');

  const hasAllData = apiKey && secret && callType && callId && userId;
  const router = useRouter();
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const generator = new JwtTokenGenerator(secret);
    const token = await generator.generate({ user_id: userId });
    let userClient: StreamVideoClient | undefined = undefined;
    let creatorClient: StreamVideoClient | undefined = undefined;

    try {
      userClient = new StreamVideoClient(apiKey);
      await userClient.connectUser({ id: userId }, token);
      const userCall = userClient.call(callType, callId);
      await userCall.get();

      // ensure that the current user can join the livestream
      const creatorId = userCall.state.createdBy?.id;
      if (creatorId && creatorId !== userId) {
        creatorClient = new StreamVideoClient(apiKey);
        const creatorToken = await generator.generate({ user_id: creatorId });
        await creatorClient.connectUser({ id: creatorId }, creatorToken);
        const creatorCall = creatorClient.call(callType, callId);
        await creatorCall.get();
        await creatorCall.updateCallMembers({
          update_members: [{ user_id: userId, role: 'user' }],
        });
        if (
          creatorCall.state.settings?.backstage.enabled &&
          creatorCall.state.backstage
        ) {
          await creatorCall.goLive();
        }
      }

      const params = new URLSearchParams({
        api_key: apiKey,
        token: token,
        type: callType,
        skip_lobby: 'true',
        layout: 'LivestreamLayout',
      });
      await router.push(`/join/${callId}?${params.toString()}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      await userClient?.disconnectUser().catch((err) => console.error(err));
      await creatorClient?.disconnectUser().catch((err) => console.error(err));
    }
  };

  const edges = useEdges();
  return (
    <>
      <DefaultAppHeader />
      <LatencyMap sourceData={edges} />
      <div className="rd__home rd__livestream__setup">
        <div className="rd__home-content">
          <img
            className="rd__home-image"
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/home.png`}
            alt="Home"
          />
          <h1 className="rd__home-heading">Stream Livestreaming Demo setup</h1>
          <p className="rd__home-description">
            Please provide your credentials in the form below and we'll take
            care of the rest.
          </p>

          <form className="rd__livestream__credentials" onSubmit={handleSubmit}>
            <div className="rd__livestream__credentials_row">
              <label className="rd__livestream__label" htmlFor="apiKey">
                API key:
              </label>
              <input
                className="rd__input"
                id="apiKey"
                placeholder="e.g.: mmhfdzb5evj2"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="rd__livestream__credentials_row">
              <label className="rd__livestream__label" htmlFor="secret">
                API secret:
              </label>
              <input
                className="rd__input"
                id="secret"
                placeholder="e.g.: 5cssrefv55rs3cnkk38kfjam2..."
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
            </div>
            <div className="rd__livestream__credentials_row">
              <label className="rd__livestream__label" htmlFor="callType">
                Call type:
              </label>
              <input
                className="rd__input"
                id="callType"
                value={callType}
                onChange={(e) => setCallType(e.target.value)}
                placeholder="livestream"
              />
            </div>
            <div className="rd__livestream__credentials_row">
              <label className="rd__livestream__label" htmlFor="callId">
                Call ID:
              </label>
              <input
                className="rd__input"
                id="callId"
                placeholder="livestream-call-id"
                value={callId}
                onChange={(e) => setCallId(e.target.value)}
              />
            </div>
            <div className="rd__livestream__credentials_row">
              <label className="rd__livestream__label" htmlFor="userId">
                User ID:
              </label>
              <input
                className="rd__input"
                id="userId"
                placeholder="user id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>

            {error && <div className="rd__livestream__errors">{error}</div>}

            <button
              type="submit"
              className="rd__button rd__button--primary rd__livestream__credentials__join"
              data-testid="join-livestream"
              disabled={!hasAllData}
            >
              Join
            </button>
          </form>

          <p className="rd__livestream__privacy-note">
            No worries, the information you provided remains private and will
            not leave your device.
          </p>
        </div>
      </div>
    </>
  );
}
