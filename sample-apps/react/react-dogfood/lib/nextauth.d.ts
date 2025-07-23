import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user?: {
      name?: string;
      email?: string;
      image?: string;
      stream: boolean;
      streamUserId: string;
    };
  }

  interface User {
    id: string;
    name?: string;
    email?: string;
    image?: string;
    stream: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    stream: boolean;
  }
}
