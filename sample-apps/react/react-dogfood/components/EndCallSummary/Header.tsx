import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@stream-io/video-react-sdk';

export interface HeaderProps {
  rejoin: () => void;
  startNewCall: () => void;
  setShowRecordings: () => void;
}

export function Header({
  rejoin,
  startNewCall,
  setShowRecordings,
}: HeaderProps) {
  return (
    <div className="rd__leave--header">
      <div className="rd__leave--header-logo">
        <Link href="/">
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/stream-logo-blue.png`}
            alt="Stream logo"
            width={54}
            height={54}
          />
        </Link>
        <div className="rd__leave--header-text">
          <h2 className="rd__leave--header-title">Your Call Has Ended.</h2>
          <p className="rd__leave--header-description">
            Rejoin or start a new call to continue testing.
          </p>
        </div>
      </div>
      <div className="rd__leave--header-links">
        <button className="rd__leave--header-link" onClick={setShowRecordings}>
          <Icon icon="film-roll" />
          View Recordings
        </button>
        <div className="rd__leave--header-links-buttons">
          <button
            className="rd__leave--header-link rd__leave--header-link--rejoin"
            onClick={rejoin}
          >
            Rejoin
          </button>
          <button
            className="rd__leave--header-link rd__leave--header-link--new-call"
            onClick={startNewCall}
          >
            Start New Call
          </button>
        </div>
      </div>
    </div>
  );
}
