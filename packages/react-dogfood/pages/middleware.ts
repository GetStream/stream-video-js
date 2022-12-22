export { default } from 'next-auth/middleware';

export const config = {
  // allow-insecure access to the following routes
  matcher: ['/((?!join-guest|_next/static|favicon.ico).*)'],
};
