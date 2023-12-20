import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { meetingId } from '../../lib/meetingId';
import { DefaultAppHeader } from '../../components/DefaultAppHeader';

export default function Guest() {
  const params = useSearchParams();

  const callIdFromQuery = params.get('callId');
  const nameFromQuery = params.get('name') || 'Guest';
  const [callId, setCallId] = useState(() => callIdFromQuery || meetingId());
  const [name, setName] = useState(nameFromQuery);

  useEffect(() => {
    if (callIdFromQuery) {
      setCallId(callIdFromQuery);
    }
  }, [callIdFromQuery]);

  useEffect(() => {
    setName(nameFromQuery);
  }, [nameFromQuery]);

  return (
    <>
      <DefaultAppHeader />
      <div className="rd__guest-page rd__home">
        <div className="rd__guest-page__content">
          <div className="rd__guest-page__header">
            <img
              className="rd__home-image"
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/home.png`}
              alt="Home"
            />
            <h1 className="rd__home-heading">
              Stream
              <span>[Video Calling]</span>
            </h1>
            <p className="rd__home-description">
              Start a new call or join an existing one by providing its Call ID
            </p>
            <div className="rd__guest-page__config">
              <input
                type="text"
                className="rd__input rd__input--underlined rd__join-call-input"
                placeholder="Meeting ID"
                value={callId}
                onChange={(e) => setCallId(e.target.value)}
              />
              <input
                type="text"
                className="rd__input rd__input--underlined rd__join-call-input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="rd__guest-page__buttons">
              <Link
                className="rd__link rd__link--faux-button rd__link--primary"
                data-testid="join-call-as-guest-button"
                href={`/guest/join/${callId}?mode=guest&guest_user_id=${name}`}
                children="Join as Guest"
              />
              <Link
                className="rd__link rd__link--faux-button"
                data-testid="join-call-as-anon-button"
                href={`/guest/join/${callId}?mode=anon`}
                children="Join Anonimously"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
