import { Call, PermissionRequestEvent } from '@stream-io/video-react-sdk';
import { AcceptIcon, CloseIcon } from '../../icons';

interface SpeakingRequestProps {
  call: Call | undefined;
  speakingRequest: PermissionRequestEvent;
  answered: (speakingRequest: PermissionRequestEvent) => void;
}

function SpeakingRequest({
  call,
  speakingRequest,
  answered,
}: SpeakingRequestProps): JSX.Element {
  return (
    <div className="speaking-request">
      <p>
        <strong>{speakingRequest.user.name}</strong> wants to speak
      </p>

      <div className="speaking-request-buttons">
        <button
          className="icon-button reject-button"
          onClick={() => denyRequest()}
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

  async function acceptRequest() {
    await call?.updateUserPermissions({
      user_id: speakingRequest.user.id,
      grant_permissions: [...speakingRequest.permissions],
    });
    answered(speakingRequest);
  }

  function denyRequest() {
    answered(speakingRequest);
  }
}
export default SpeakingRequest;
