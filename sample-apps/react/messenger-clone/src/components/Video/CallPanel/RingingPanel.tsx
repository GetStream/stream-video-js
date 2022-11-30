import { Member } from '@stream-io/video-client/dist/src/gen/video/coordinator/member_v1/member';

type OutGoingRingingPanelProps = {
  hangUp: () => void;
  memberList: Member[];
  accept?: () => void;
};

export const RingingCallPanel = ({
  accept,
  hangUp,
  memberList,
}: OutGoingRingingPanelProps) => {
  return (
    <div>
      {/*<img src={memberList[0].imageUrl} alt={memberList[0].name} />*/}
      {/*<p>{memberList[0].name}</p>*/}
      <p>{memberList[0].userId}</p>
      <button onClick={hangUp}>Hang up</button>
      {accept && <button onClick={accept}>Accept</button>}
    </div>
  );
};
