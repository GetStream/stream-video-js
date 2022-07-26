import React from 'react';
import {
  Box,
  Button,
  Snackbar,
  SnackbarContent,
  Typography,
} from '@mui/material';
import CallAccept from '@mui/icons-material/Call';
import CallReject from '@mui/icons-material/CallEnd';

export type RingerProps = {
  caller: string;
  onAccept?: () => void;
  onReject?: () => void;
};

export const Ringer = (props: RingerProps) => {
  const { caller, onAccept, onReject } = props;
  return (
    <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center' }} open>
      <SnackbarContent
        sx={{
          width: '380px',
          '& .MuiSnackbarContent-message': {
            flex: 1,
          },
        }}
        message={
          <Box>
            <Typography sx={{ mt: 3, mb: 5 }}>
              Incoming video call from {caller}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'end',
                '& .MuiButton-root': {
                  ml: 1,
                },
              }}
            >
              <Button
                color="success"
                variant="contained"
                startIcon={<CallAccept />}
                onClick={onAccept}
              >
                Accept
              </Button>
              <Button
                color="error"
                variant="contained"
                startIcon={<CallReject />}
                onClick={onReject}
              >
                Reject
              </Button>
            </Box>
          </Box>
        }
      />
    </Snackbar>
  );
};
