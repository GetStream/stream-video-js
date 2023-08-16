import { Avatar, useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import type { CustomCallData, User } from '../../types';

export const RoomCard = () => {
  const call = useCall();
  const { useCallCustomData, useCallCreatedBy, useCallEndedAt } =
    useCallStateHooks();
  const customData = useCallCustomData();
  const creator = useCallCreatedBy();
  const endedAt = useCallEndedAt();
  const { title, hosts, description } = (customData || {}) as CustomCallData;
  const backupHost =
    creator &&
    ({
      name: creator.name,
      id: creator.id,
      imageUrl: creator.image,
    } as User);

  return (
    <div className="room-card">
      <h3>
        {title || call?.id} {endedAt && '(ENDED)'}
      </h3>
      <span>Host(s)</span>
      <div className="hosts-grid">
        {hosts?.length ? (
          hosts.map((host, index) => (
            <Host host={host} key={`${host.id}-${index}`} />
          ))
        ) : backupHost ? (
          <Host host={backupHost} />
        ) : null}
      </div>
      {description && <p>{description}</p>}
    </div>
  );
};

type HostProps = {
  host: User;
};
const Host = ({ host }: HostProps) => {
  const displayName = host.name || host.id;
  return (
    <div>
      <Avatar name={displayName} imageSrc={host?.imageUrl} />
      <span>{displayName}</span>
    </div>
  );
};
