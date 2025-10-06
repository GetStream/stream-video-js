# Guidance for AI coding agents

File purpose: operational rules for automated or assisted code changes. Human-facing conceptual docs belong in `README.md` or the docs site.

## Repository purpose

Stream Video SDKs for:

- React
- React Native
- Plain JavaScript (core client)

Goals: API stability, backward compatibility, predictable releases, strong test coverage, accessibility, and performance discipline.

## Tech & toolchain

- Languages: TypeScript, React (web + native)
- Runtime: Node (use `nvm use` with `.nvmrc`)
- Package manager: Yarn (workspaces)
- Testing: Vitest (unit/integration), Playwright (E2E)
- Lint/Format: ESLint + Prettier
- Build: Package-local build scripts (composed via root)
- Release: Conventional Commits -> automated versioning/publishing
- Platforms:
  - React: Web
  - React Native: iOS and Android

## Environment setup

1. `nvm use`
2. `yarn install`
3. (Optional) Verify: `node -v` matches `.nvmrc`
4. Run initial full build: `yarn build:all`
5. Run tests: `yarn test:ci:all`

## Project layout (high-level)

- `packages/`
  - `react-sdk/`
  - `react-native-sdk/`
  - `client/` (core, no UI)
- `sample-apps/`
  - `react/`
  - `react-native/`
  - `client/`
- Config roots: linting, tsconfig, playwright, babel
- Do not edit generated output (`dist/`, build artifacts)

## Core commands (Runbook)

| Action                              | Command                                    |
| ----------------------------------- | ------------------------------------------ |
| Install deps                        | `yarn install`                             |
| Full build                          | `yarn build:all`                           |
| Watch (if available)                | `yarn dev` or `yarn start` (add if absent) |
| Lint                                | `yarn lint:all`                            |
| Fix lint (if separate)              | `yarn lint:all --fix`                      |
| Unit/Integration tests (CI profile) | `yarn test:ci:all`                         |
| Local fast tests                    | `yarn test`                                |
| E2E (Playwright)                    | `yarn test:e2e`                            |
| Coverage                            | `yarn test:coverage`                       |
| Clean                               | `yarn clean:all`                           |

## API design principles

- Semantic versioning
- Use `@deprecated` JSDoc with replacement guidance
- Provide migration docs for breaking changes
- Avoid breaking changes; prefer additive evolution
- Public surfaces: explicit TypeScript types/interfaces
- Consistent naming: `camelCase` for functions/properties, `PascalCase` for components/types

### Deprecation lifecycle

1. Mark with `@deprecated` + rationale + alternative.
2. Maintain for at least one minor release unless security-critical.
3. Add to migration documentation.
4. Remove only in next major.

## Performance guidelines

- Minimize re-renders (memoization, stable refs)
- Use `React.memo` / `useCallback` / `useMemo` when profiling justifies
- Clean up side effects (`AbortController` for network calls)
- Monitor bundle size; justify increases > 2% per package
- Prefer lazy loading for optional heavy modules
- Avoid unnecessary large dependency additions

## Accessibility (a11y)

- All interactive elements keyboard accessible
- Provide ARIA roles/labels where semantic tags insufficient
- Maintain color contrast (WCAG AA)
- Do not convey state by color alone
- Announce dynamic content changes (ARIA live regions if needed)

## Error & logging policy

- Public API: throw descriptive errors or return typed error results (consistent with existing patterns)
- No console noise in production builds
- Internal debug logging gated behind env flag (if present)
- Never leak credentials/user data in errors

## Concurrency & async

- Cancel stale async operations (media, network) when components unmount
- Use `AbortController` for fetch-like APIs
- Avoid race conditions: check instance IDs / timestamps before state updates

## Testing strategy

- Unit: pure functions, small components
- Integration: component-tree interactions, state flows
- React Native: target minimal smoke + platform logic (avoid flakiness)
- E2E: critical user journeys (Playwright)
- Mocks/fakes: prefer shared test helpers
- Coverage target: maintain or improve existing percentage (fail PR if global coverage drops)
- File naming: `*.test.ts` / `*.spec.ts(x)`
- Add tests for: new public API, bug fixes (regression test), performance-sensitive utilities

## CI expectations

- Mandatory: build, lint, type check, unit/integration tests, (optionally) E2E smoke
- Node versions: those listed in matrix (see workflow YAML)
- Failing or flaky tests: fix or quarantine with justification PR comment (temporary)
- Zero new warnings

## Release workflow (high-level)

1. Conventional Commit messages on PR merge
2. Release automation aggregates commits
3. Version bump + changelog + tag
4. Publish to registry
5. Deprecations noted in CHANGELOG
6. Ensure docs updated prior to publishing breaking changes

## Dependency policy

- Avoid adding large deps without justification (size, maintenance)
- Prefer existing utility packages
- Run `yarn audit` (or equivalent) if adding security-impacting deps
- Keep upgrades separate from feature changes when possible

## Samples & docs

- New public feature: update at least one sample app
- Breaking changes: provide migration snippet
- Keep code snippets compilable
- Use placeholder keys (`YOUR_STREAM_KEY`)

## React Native specifics

- Clear Metro cache if module resolution issues: `yarn react-native start --reset-cache`
- Test on iOS + Android for native module or platform-specific UI changes
- Avoid unguarded web-only APIs in shared code

## Linting & formatting

- Run `yarn lint:all` before commit
- Narrowly scope `eslint-disable` with inline comments and rationale
- No broad rule disabling

## Commit / PR conventions

- Small, focused PRs
- Include tests for changes
- Screenshot or video for UI changes (before/after)
- Label breaking changes clearly in description
- Document public API changes

## Security

- No credentials or real user data
- Use placeholders in examples
- Scripts must error on missing critical env vars
- Avoid introducing unmaintained dependencies

## Prohibited edits

- Do not edit build artifacts (`dist/`, generated types)
- Do not bypass lint/type errors with force merges

## Quick agent checklist (per commit)

- Build succeeds
- Lint clean
- Type check clean
- Tests (unit/integration) green
- Coverage not reduced
- Public API docs updated if changed
- Samples updated if feature surfaced
- No new warnings
- No generated files modified

---

Refine this file iteratively for agent clarity; keep human-facing explanations in docs site / `README.md`.
