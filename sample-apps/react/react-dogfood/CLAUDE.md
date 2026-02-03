# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Stream Video React Dogfood Application** - a Next.js 16 + React 19 application that serves as the primary testing and demonstration platform for the `@stream-io/video-react-sdk`. It showcases production-ready video calling features including multi-participant calls, screen sharing, recording, chat integration, video/audio effects, and developer debugging tools.

This is a **sample app within a monorepo**. See the root-level `/AGENTS.md` for general monorepo conventions.

## Commands

### Development

```bash
# Initial setup
yarn install                    # Install dependencies (run from repo root)
yarn build:react:deps          # Build all React SDK dependencies

# Development server
yarn dev                       # Start Next.js dev server on localhost:3000
yarn dev:https                 # Start with HTTPS for testing media permissions

# Watch mode for SDK development (run in separate terminals)
yarn start:react:sdk           # Watch @stream-io/video-react-sdk
yarn start:styling             # Watch @stream-io/video-styling
yarn start:client              # Watch @stream-io/video-client
```

### Building

```bash
yarn build                     # Production build
yarn start                     # Start production server
yarn clean                     # Clean build artifacts
```

### Code Quality

```bash
yarn lint:all                  # Lint packages and sample apps (from root)
yarn lint:sample-apps          # Lint sample apps only (from root)
```

## Environment Setup

1. Copy environment template: `cp .env.example .env.local`
2. Required environment variables:
   - `STREAM_API_KEY` - Stream API key (for 'pronto' environment)
   - `STREAM_SECRET_KEY` - Stream secret key (for 'pronto' environment)
   - `NEXTAUTH_SECRET` - NextAuth secret for session signing
   - Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for OAuth

3. Multi-environment configuration via `SAMPLE_APP_CALL_CONFIG` JSON:
   ```json
   {
     "demo": { "apiKey": "...", "secret": "..." },
     "pronto": { "apiKey": "...", "secret": "..." },
     "pronto-sales": { "apiKey": "...", "secret": "..." }
   }
   ```

## Architecture

### Routing (Next.js Pages Router)

- **pages/index.tsx** - Landing page with call ID input
- **pages/join/[callId].tsx** - Main call room (dynamic route)
- **pages/api/auth/[...nextauth].ts** - NextAuth authentication
- **pages/api/auth/create-token.ts** - JWT token generation endpoint
- **pages/api/call/** - Call management endpoints

### Component Organization

Components are organized by feature/responsibility:

- **MeetingUI.tsx** - Top-level orchestrator (Lobby → ActiveCall → Left states)
- **Lobby.tsx** - Pre-call device selection and settings
- **ActiveCall.tsx** - Active call UI with participant grid/layout
- **CallLayout/** - Layout components (Grid, Speaker, Spotlight)
- **Debug/** - Debug panels and inspection tools
- **Inspector/** - Deep SDK state inspection
- **Settings/** - Audio/video/effects configuration

### SDK Integration Flow

1. **Server-side credentials** (`lib/getServerSideCredentialsProps.ts`):
   - Validates NextAuth session
   - Generates JWT token for user
   - Returns `{ apiKey, userToken, user }` to page

2. **Client initialization** (`helpers/client.ts`):
   - Lazy singleton pattern for `StreamVideoClient`
   - Configured with token provider for auto-refresh
   - Custom logger, transformers, coordinator URL

3. **Call setup** (in page component):
   ```typescript
   const client = getClient({ apiKey, user, userToken }, environment);
   const call = client.call(type, id);
   // Wrap with <StreamVideo client={client}><StreamCall call={call}>
   ```

### State Management

- **Contexts**:
  - `AppEnvironmentContext` - Multi-environment switching (pronto/demo/etc.)
  - `SettingsContext` - User preferences (persisted to localStorage)
  - `TourContext` - Guided tour state

- **SDK State**: Use hooks from `@stream-io/video-react-sdk`:
  - `useCall()` - Current call object
  - `useCallStateHooks()` - Granular call state access
  - `useConnectedUser()` - Current user
  - `useParticipants()` - Participant list

### Key Patterns

**Multi-environment support**:

- Environment determined by URL query param `?environment=pronto` or `NEXT_PUBLIC_APP_ENVIRONMENT`
- Config loaded from `lib/environmentConfig.ts` using `getEnvironmentConfig()`
- Allows testing against different Stream backends

**Token refresh**:

- Server-side: JWT creation in `/api/auth/create-token`
- Client-side: `tokenProvider` function auto-refreshes before expiry
- Tokens valid for 4 hours by default

**Authentication flow**:

- NextAuth with two providers: StreamDemoAccount (auto-login) and Google OAuth
- Session validated server-side in `getServerSideProps`
- Role-based access: `stream: true` for @getstream.io emails

## Workspace Dependencies

This app depends on workspace packages (using `workspace:^`):

- `@stream-io/video-react-sdk` - Main React SDK
- `@stream-io/video-filters-web` - Video effects (blur, filters)
- `@stream-io/audio-filters-web` - Audio effects (noise cancellation)
- `@stream-io/video-styling` - SDK styles
- `@stream-io/node-sdk` - Server-side SDK for token generation

When making changes to SDK packages, run them in watch mode for live updates.

## Development Workflow

### Adding a new page

1. Create `pages/your-page.tsx`
2. Use `getServerSideCredentialsProps` for auth
3. Initialize client and call
4. Wrap with `<StreamVideo>` and `<StreamCall>` providers

### Adding a new component

1. Create `components/YourComponent.tsx`
2. Create styles in `style/YourComponent/index.scss`
3. Use SDK hooks for call state
4. Export from `components/index.ts`

### Adding a custom hook

1. Create `hooks/useYourHook.ts`
2. Export from `hooks/index.ts`
3. Can compose SDK hooks with React hooks

### Testing SDK changes locally

1. Navigate to SDK package: `cd packages/react-sdk`
2. Run in watch mode: `yarn start`
3. Changes automatically rebuild and reflect in dogfood app

## Configuration Files

- **next.config.ts**:
  - React Compiler enabled (`reactCompiler: true`)
  - Sentry integration with source maps
  - CORS headers for token/sample endpoints
  - Base path support for deployment under subdirectory

- **instrumentation.ts / instrumentation-client.ts**:
  - Sentry error tracking setup
  - Session replay and performance monitoring

## Important Notes

### Coordinator URL Override

For local/custom coordinator testing:

```
?coordinator_url=http://localhost:3030/video
?use_local_coordinator=true  (uses env NEXT_PUBLIC_STREAM_API_URL)
```

### Skip Lobby

Set `NEXT_PUBLIC_SKIP_LOBBY=true` to bypass device selection and join directly.

### Disable Chat

Set `NEXT_PUBLIC_DISABLE_CHAT=true` to disable Stream Chat integration.

### Video Effects

Background filters require `BackgroundFiltersProvider` wrapper. Noise cancellation requires `NoiseCancellationProvider`. Both are initialized in the component tree.

### Error Tracking

Sentry captures errors and sessions. Custom logger in `helpers/logger.ts` integrates with Sentry breadcrumbs.

## Monorepo Context

Run commands from the **repo root** (`stream-video-js/`) using workspace-aware scripts:

```bash
yarn start:react:dogfood     # Start this app
yarn build:react:deps        # Build dependencies
yarn lint:sample-apps        # Lint sample apps
```

See `/AGENTS.md` at repo root for:

- General development practices
- Testing strategy
- API design principles
- Performance and accessibility guidelines
