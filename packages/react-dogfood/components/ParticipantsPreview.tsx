import { Avatar, useCallMetadata } from '@stream-io/video-react-sdk';
import { Stack, Typography } from '@mui/material';

export const ParticipantsPreview = () => {
  const callMetadata = useCallMetadata();

  if (
    !(
      callMetadata?.session?.participants &&
      callMetadata?.session?.participants.length
    )
  )
    return null;
  return (
    <Stack sx={{ gap: '0.75rem', margin: 0 }}>
      <Typography sx={{ fontSize: '1.125rem', fontWeight: '700' }}>
        Already in call ({callMetadata.session.participants.length}):
      </Typography>
      <Stack
        direction="row"
        sx={{
          flexWrap: 'wrap',
          overflowY: 'auto',
          maxHeight: '300px',
          maxWidth: '200px',
          gap: '0.5rem',
        }}
      >
        {callMetadata.session.participants.map((participant) => (
          <Stack alignItems="center" key={participant.user.id}>
            <Avatar
              name={participant.user.name}
              imageSrc={participant.user.image}
            />
            {participant.user.name && <div>{participant.user.name}</div>}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};
