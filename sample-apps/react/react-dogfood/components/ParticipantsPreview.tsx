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
      <Typography variant="body1">
        Already in this call ({callMetadata.session.participants.length}):
      </Typography>
      <Stack
        direction="row"
        gap="0.5rem"
        flexWrap="wrap"
        sx={{
          overflowY: 'auto',
        }}
      >
        {callMetadata.session.participants.map((participant) => (
          <Stack alignItems="center" key={participant.user_session_id}>
            <Avatar
              name={participant.user.name}
              imageSrc={participant.user.image}
            />
            {participant.user.name && (
              <Typography variant="caption">{participant.user.name}</Typography>
            )}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};
