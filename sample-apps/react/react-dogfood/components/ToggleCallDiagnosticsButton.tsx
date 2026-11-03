import {
  Call,
  CompositeButton,
  Icon,
  WithTooltip,
} from '@stream-io/video-react-sdk';
import { useRouter } from 'next/router';

import { decodeBase64 } from '../helpers/base64';
import { useAppI18n } from '../hooks/useAppI18n';

export const ToggleCallDiagnosticsButton = ({ call }: { call: Call }) => {
  const router = useRouter();
  const { t } = useAppI18n();
  const appId = getAppId(call);
  const callSessionId = call.state.session?.id;
  const disabled = !appId || !callSessionId;

  const openDiagnostics = () => {
    if (disabled) return;
    const url = new URL(
      `/debug-call/${encodeURIComponent(call.cid)}`,
      window.location.origin,
    );
    url.searchParams.set('app_id', String(appId));
    url.searchParams.set('call_session_id', callSessionId);

    for (const key of [
      'api_key',
      'coordinator_url',
      'environment',
      'use_local_coordinator',
    ]) {
      const value = router.query[key];
      if (typeof value === 'string') url.searchParams.set(key, value);
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <WithTooltip title={t('callControls.debugCall.title', 'Debug call')}>
      <CompositeButton
        disabled={disabled}
        title={t('callControls.debugCall.title', 'Debug call')}
        onClick={openDiagnostics}
      >
        <Icon icon="developer" />
      </CompositeButton>
    </WithTooltip>
  );
};

const getAppId = (call: Call): number | undefined => {
  try {
    const token = call['credentials']?.token;
    const payload = token?.split('.')[1];
    if (!payload) return undefined;
    const appId = Number(JSON.parse(decodeBase64(payload))['app_id']);
    return Number.isFinite(appId) && appId > 0 ? appId : undefined;
  } catch {
    return undefined;
  }
};
