import { getProviders, signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button, Divider, Stack, Typography } from '@mui/material';

type Providers = ReturnType<typeof getProviders> extends Promise<infer R>
  ? R
  : never;

export default function SignIn({ providers }: { providers: Providers }) {
  const { status } = useSession();

  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      const returnUrl = (router.query['callbackUrl'] as string) || '/';
      router.push(returnUrl);
    }
  }, [router, status]);

  return (
    <>
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={2}
        flexGrow={1}
      >
        <Stack spacing={2}>
          <Typography variant="h2">Stream Meetings</Typography>
          <Divider />
          {Object.values(providers!).map((provider) => (
            <div key={provider.name}>
              <Button
                data-testid="sign-in-button"
                variant="contained"
                fullWidth
                onClick={() => signIn(provider.id)}
              >
                Sign in with your Google Stream account
              </Button>
            </div>
          ))}
        </Stack>
      </Stack>
    </>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
