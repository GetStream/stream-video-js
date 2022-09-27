import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === 'unauthenticated') {
      void signIn();
    }
  }, [status]);

  if (!session) {
    return null;
  }
  return (
    <>
      Signed in as {session.user.email} <br />
      <button onClick={() => signOut()}>Sign out</button>
    </>
  );
}
