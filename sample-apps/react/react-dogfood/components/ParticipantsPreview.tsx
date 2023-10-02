import {
  Avatar,
  CallPreview,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const ParticipantsPreview = () => {
  const { useCallSession, useCallThumbnail } = useCallStateHooks();
  const session = useCallSession();
  const thumbnail = useCallThumbnail();

  if (!session?.participants || session?.participants.length === 0) return null;
  return (
    <Stack direction="row">
      <Box>
        <Accordion defaultExpanded sx={{ boxShadow: 'none' }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon style={{ color: 'white' }} />}
          >
            <Typography variant="body1">
              Already in this call ({session.participants.length}):
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
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
                  participant.user.name ??
                  participant.user.id ??
                  'Unknown user';
                return (
                  <Stack
                    alignItems="center"
                    gap="8px"
                    key={participant.user_session_id}
                  >
                    <Avatar
                      name={displayName}
                      imageSrc={participant.user.image}
                    />
                    <Typography variant="caption">{displayName}</Typography>
                  </Stack>
                );
              })}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Box>
      {thumbnail && (
        <Box>
          <Accordion defaultExpanded sx={{ boxShadow: 'none' }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon style={{ color: 'white' }} />}
            >
              <Typography variant="body1">
                Sneak-peek inside the call:
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <CallPreview style={{ width: '240px', height: '135px' }} />
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </Stack>
  );
};
