import { Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <Stack justifyContent="center" alignItems="center" flexGrow={1} spacing={3}>
      <Typography variant="h3" textAlign="center">
        Livestream App
      </Typography>
      <Stack direction="row" spacing={2}>
        <Link to="/hosts">
          <Button variant="contained">For hosts</Button>
        </Link>
        <Link to="/viewers">
          <Button variant="contained">For viewers</Button>
        </Link>
      </Stack>
    </Stack>
  );
};
