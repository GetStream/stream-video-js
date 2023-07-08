import { PermissionRequestEvent } from '@stream-io/video-react-sdk';
import { AcceptIcon, CloseIcon } from './icons';

type SpeakingRequestsListProps = {
  acceptRequest: (speakingRequest: PermissionRequestEvent) => Promise<void>;
  close: () => void;
  dismissSpeakingRequest: (request: PermissionRequestEvent) => void;
  speakingRequests: PermissionRequestEvent[];
};

export const SpeakingRequestsList = ({
  acceptRequest,
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
          accept={acceptRequest}
          key={speakingRequest.user.id}
          speakingRequest={speakingRequest}
          dismiss={dismissSpeakingRequest}
        />
      ))
    ) : (
      <div>There are no speaker requests</div>
    )}
  </div>
);

interface SpeakingRequestProps {
  accept: (speakingRequest: PermissionRequestEvent) => Promise<void>;
  dismiss: (speakingRequest: PermissionRequestEvent) => void;
  speakingRequest: PermissionRequestEvent;
}

const SpeakingRequest = ({
  accept,
  dismiss,
  speakingRequest,
}: SpeakingRequestProps) => {
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
          onClick={() => accept(speakingRequest)}
        >
          <AcceptIcon />
        </button>
      </div>
    </div>
  );
};
export default SpeakingRequestsList;
