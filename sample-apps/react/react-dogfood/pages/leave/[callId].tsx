import { useRouter } from 'next/router';

import { StreamI18nProvider } from '@stream-io/video-react-sdk';

import { Feedback } from '../../components/Feedback/Feedback';
import { DefaultAppHeader } from '../../components/DefaultAppHeader';

import translations from '../../translations';
import { useSettings } from '../../context/SettingsContext';

export default function Leave() {
  const {
    settings: { language },
  } = useSettings();

  return (
    <StreamI18nProvider
      translationsOverrides={translations}
      language={language}
    >
      <LeaveContent />
    </StreamI18nProvider>
  );
}

const LeaveContent = () => {
  const router = useRouter();

  const callId = router.query['callId'] as string;

  return (
    <>
      <DefaultAppHeader />
      <div className="rd__leave">
        <div className="rd__leave-content">
          <Feedback inMeeting={false} callId={callId} />
        </div>
      </div>
    </>
  );
};
