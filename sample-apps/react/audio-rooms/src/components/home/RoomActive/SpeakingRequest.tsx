import { Call, PermissionRequestEvent } from '@stream-io/video-react-sdk';
import { AcceptIcon, CloseIcon } from '../../icons';

interface SpeakingRequestProps {
  call: Call | undefined;
  speakingRequest: PermissionRequestEvent;
}

function SpeakingRequest({
  call,
  speakingRequest,
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

  function acceptRequest() {
    call?.updateUserPermissions({
      user_id: speakingRequest.user.id,
      grant_permissions: [...speakingRequest.permissions],
    });
  }

  function denyRequest() {}
}
export default SpeakingRequest;
