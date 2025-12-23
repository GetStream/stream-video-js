# @stream-io/video-codemod

This package contains codemods to help migrate your codebase when upgrading Stream Video SDK versions.

## use-call-state-hooks

This codemod transforms `useCallStateHooks()` usage for React Compiler compatibility.

The React Compiler requires that hooks are called at the module level, not inside components. This codemod hoists
`useCallStateHooks()` calls from inside React components to module scope.

### Before

```tsx
import { useCallStateHooks } from '@stream-io/video-react-sdk';

const MyComponent = () => {
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();
  // ...
};
```

### After

```tsx
import { useCallStateHooks as getCallStateHooks } from '@stream-io/video-react-sdk';

const { useCallCallingState, useParticipants } = getCallStateHooks();

const MyComponent = () => {
  const callingState = useCallCallingState();
  const participants = useParticipants();
  // ...
};
```

### Usage

Please carefully review all generated changes before committing them. Certain edge cases cannot be handled automatically
and will be reported in the log output.

**Recommended (using the CLI):**

```bash
npx @stream-io/video-codemod use-call-state-hooks ./path/to/src --extensions=ts,tsx --parser=tsx
```

**Note:** Applying the codemod might break your code formatting, so please run Prettier and ESLint after you've applied
the codemod.

```bash
npx prettier --write "src/**/*.{ts,tsx}"
```
