import { Avatar, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Stack, Typography } from '@mui/material';

export const ParticipantsPreview = () => {
  const { useCallSession } = useCallStateHooks();
  const session = useCallSession();

  if (!session?.participants || session?.participants.length === 0) return null;
  return (
    <Stack sx={{ gap: '0.75rem', margin: 0 }}>
      <Typography variant="body1">
        Already in this call ({session.participants.length}):
      </Typography>
      <Stack
        direction="row"
        gap="0.5rem"
        flexWrap="wrap"
        sx={{
          overflowY: 'auto',
        }}
      >
        {session.participants.map((participant) => {
          const displayName =
            participant.user.name ?? participant.user.id ?? 'Unknown user';
          return (
            <Stack alignItems="center" key={participant.user_session_id}>
              <Avatar name={displayName} imageSrc={participant.user.image} />

              <Typography variant="caption">{displayName}</Typography>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
};
