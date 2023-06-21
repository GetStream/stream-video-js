import { useCallback } from 'react';
import {
  PermissionRequestEvent,
  useCall,
  useCallMetadata,
} from '@stream-io/video-react-sdk';
import { AcceptIcon, CloseIcon } from '../icons';

type SpeakingRequestsListProps = {
  close: () => void;
  dismissSpeakingRequest: (request: PermissionRequestEvent) => void;
  speakingRequests: PermissionRequestEvent[];
};

export const SpeakingRequestsList = ({
  close,
  dismissSpeakingRequest,
  speakingRequests,
}: SpeakingRequestsListProps) => (
  <div className="speaking-requests-container">
    <div className="speaking-requests-container__header">
      <h3>Speaking Requests</h3>
      <button onClick={close}>
        <CloseIcon />
      </button>
    </div>
    {speakingRequests.length ? (
      speakingRequests.map((speakingRequest) => (
        <SpeakingRequest
          key={speakingRequest.user.id}
          speakingRequest={speakingRequest}
          dismiss={dismissSpeakingRequest}
        />
      ))
    ) : (
      <div>There are not speaker requests</div>
    )}
  </div>
);

interface SpeakingRequestProps {
  dismiss: (speakingRequest: PermissionRequestEvent) => void;
  speakingRequest: PermissionRequestEvent;
}

const SpeakingRequest = ({
  dismiss,
  speakingRequest,
}: SpeakingRequestProps) => {
  const call = useCall();
  const metadata = useCallMetadata();

  const acceptRequest = useCallback(async () => {
    if (!(call && metadata?.custom)) return null;

    await call?.updateUserPermissions({
      user_id: speakingRequest.user.id,
      grant_permissions: [...speakingRequest.permissions],
    });

    await call?.update({
      custom: {
        ...(metadata?.custom || {}),
        speakerIds: [
          ...(metadata?.custom.speakerIds || []),
          speakingRequest.user.id,
        ],
      },
    });

    dismiss(speakingRequest);
  }, [dismiss, call, metadata?.custom, speakingRequest]);

  return (
    <div className="speaking-request">
      <p>
        <strong>{speakingRequest.user.name}</strong> wants to speak
      </p>

      <div className="speaking-request-buttons">
        <button
          className="icon-button reject-button"
          onClick={() => dismiss(speakingRequest)}
        >
          <CloseIcon />
        </button>
        <button
          className="icon-button accept-button"
          onClick={() => acceptRequest()}
        >
          <AcceptIcon />
        </button>
      </div>
    </div>
  );
};
export default SpeakingRequestsList;
