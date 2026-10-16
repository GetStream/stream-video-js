# Guidance for AI coding agents

File purpose: operational rules for automated or assisted code changes. Human-facing conceptual docs belong in `README.md` or the docs site.

Goals: API stability, backward compatibility, predictable releases, strong test coverage, accessibility, and performance discipline.

## Package guides

Each package has its own guide, loaded automatically when you work on files in that package:

- Core client: `packages/client/CLAUDE.md`
- React SDK: `packages/react-sdk/CLAUDE.md`
- React Native SDK: `packages/react-native-sdk/CLAUDE.md`

### Android or iOS WebRTC Reference

For research about native WebRTC behavior, iOS/Android audio session or ADM internals, or react-native-webrtc native module wrapper behavior, delegate to the `webrtc-reference` subagent (`.claude/agents/webrtc-reference.md`). It holds the reference codebase map and prefers the locally-installed `@stream-io/react-native-webrtc` fork over upstream.

## Agent execution strategy

- Start from the most specific package instructions first (`packages/*/CLAUDE.md`), then apply this root guide.
- Prefer workspace-scoped commands while iterating (example: `yarn build:client && yarn test:ci:client`); run full-monorepo commands only for final verification.
- Before finalizing cross-package changes, run CI-parity checks: `yarn lint:ci:all && yarn test:ci:all && NODE_ENV=production yarn build:all`, plus `yarn test:react-native:sdk` for React Native changes.
- Match CI commands and Node version (`.nvmrc`) before considering work complete.

## API design principles

- Semantic versioning
- Use `@deprecated` JSDoc with replacement guidance
- Provide migration docs for breaking changes
- Avoid breaking changes; prefer additive evolution
- Public surfaces: explicit TypeScript types/interfaces
- Monitor bundle size; justify increases > 2% per package
- Keep dependency upgrades separate from feature changes when possible

## Class style

- **All class methods must be arrow-function class fields**, not method syntax — including `private`/`protected` methods. This is the convention across `packages/client/src/` (e.g., `Call.leave = async (...) => {}`, `BasePeerConnection.isHealthy = () => {}`). Method syntax breaks it.

  ```ts
  // good
  class Foo {
    doThing = (x: number) => x + 1;
    private helper = () => {
      /* ... */
    };
  }

  // bad
  class Foo {
    doThing(x: number) {
      return x + 1;
    }
    private helper() {
      /* ... */
    }
  }
  ```

- **Declare state as explicit class fields** at the class body level, not as TypeScript parameter-property shorthand (`constructor(private foo: Foo)`). Assign them from the constructor body. Use field initializers for constants.

  ```ts
  // good
  class Foo {
    private a: number;
    private b: number;
    private cache: Map<string, number> = new Map();

    constructor(a: number, b: number) {
      this.a = a;
      this.b = b;
    }
  }

  // bad
  class Foo {
    constructor(
      private a: number,
      private b: number,
    ) {}
  }
  ```

### Deprecation lifecycle

1. Mark with `@deprecated` + rationale + alternative.
2. Maintain for at least one minor release unless security-critical.
3. Add to migration documentation.
4. Remove only in next major.

## Testing

- Add tests for new public API and bug fixes (regression test).
- Coverage: maintain or improve the existing percentage (fail PR if global coverage drops).
- React Native: target minimal smoke + platform logic (avoid flakiness).

## CI expectations

- Mandatory in primary workflow (`.github/workflows/test.yml`): `yarn lint:ci:all`, `yarn test:ci:all`, `NODE_ENV=production yarn build:all`, and `yarn test:react-native:sdk`
- Failing or flaky tests: fix or quarantine with justification PR comment (temporary)
- Zero new warnings

## Samples & docs

- New public feature: update at least one sample app
- Breaking changes: provide migration snippet
- Keep code snippets compilable
- Use placeholder keys (`YOUR_STREAM_KEY`); scripts must error on missing critical env vars

## React Native specifics

- Clear Metro cache if module resolution issues (dogfood app): `cd sample-apps/react-native/dogfood && yarn start --reset-cache`
- Test on iOS + Android for native module or platform-specific UI changes
- Avoid unguarded web-only APIs in shared code

## Linting

- Narrowly scope `eslint-disable` with inline comments and rationale
- No broad rule disabling

## Commit / PR conventions

- Small, focused PRs, follow the @.github/pull_request_template.md template
- Never commit directly to the `main` branch, always create a feature branch
- Never commit or push unless instructed to do so
- Use conventional commits (fix, feat, chore); releases are automated from them, and deprecations are noted in the CHANGELOG
- Include tests for changes
- Label breaking changes clearly in the description
- Document public API changes

## Prohibited edits

- Do not edit build artifacts (`dist/`, generated types)
- Do not bypass lint/type errors with force merges
- Never add credentials or real user data, and never leak them in errors or logs
