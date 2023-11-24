import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/router';

import { StreamI18nProvider, useI18n, Icon } from '@stream-io/video-react-sdk';

import { Feedback } from '../../components/Feedback/Feedback';

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
  const { t } = useI18n();
  const router = useRouter();
  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rd__leave">
      <div className="rd__leave-content">
        <Feedback inMeeting={false} />
      </div>
    </div>
  );
};

export const getServerSideProps = async () => {
  return {
    props: {},
  };
};
