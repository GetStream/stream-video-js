# Changesets Guide

We use [Changesets](https://github.com/changesets/changesets) for version management and changelog generation.

## Quick Start

When you make changes to published packages, create a changeset:

```bash
yarn changeset
```

This interactive command will:

1. Ask which packages changed
2. Ask what type of change (major/minor/patch)
3. Ask for a summary of changes

The changeset file will be committed with your PR.

## When to Create Changesets

**Always create a changeset when:**

- Changing any published package (`@stream-io/video-*` packages)
- Adding features, fixing bugs, or making breaking changes
- Updating dependencies that affect users

**Never create a changeset for:**

- Sample apps (they're not published to npm)
- Documentation-only changes
- Internal tooling changes

## Version Bump Guidelines

Choose the appropriate version bump type:

### Major (Breaking Changes)

- API changes that require users to update their code
- Removing features or methods
- Changing function signatures
- Renaming public APIs

**Example:**

```typescript
// Before: call.join()
// After: call.connect()  ← Breaking change!
```

### Minor (New Features)

- Adding new features
- Adding new methods or properties
- Backwards compatible enhancements

**Example:**

```typescript
// Adding a new method
call.setMaxVideoBitrate(1000); // ← New feature, backwards compatible
```

### Patch (Bug Fixes)

- Bug fixes
- Performance improvements
- No new features or breaking changes

**Example:**

```typescript
// Fixed: Connection timeout now properly handled
```

## Common Scenarios

### Single Package Change

If you only changed one package:

```bash
yarn changeset

? Which packages would you like to include?
❯ ◉ @stream-io/video-client
  ◯ @stream-io/video-react-sdk

? What kind of change is this for @stream-io/video-client?
  ◯ major (breaking)
  ◉ minor (feature)
  ◯ patch (bugfix)

? Please enter a summary:
Add setMaxVideoBitrate method for bandwidth control
```

### Multiple Package Changes

If your change affects multiple packages (e.g., adding a hook in react-bindings and using it in react-sdk):

```bash
yarn changeset

? Which packages would you like to include?
  ◉ @stream-io/video-react-bindings
  ◉ @stream-io/video-react-sdk

? What kind of change is this for @stream-io/video-react-bindings?
  ◉ minor (new hook)

? What kind of change is this for @stream-io/video-react-sdk?
  ◉ minor (new component)

? Please enter a summary:
Add useScreenShare hook and ScreenShareButton component

The new useScreenShare hook provides access to screen sharing state
and controls. The ScreenShareButton component uses this hook to
provide a pre-built screen sharing button.
```

### Dependency-Only Change

If you only updated dependencies (no code changes):

```bash
yarn changeset

? Which packages would you like to include?
  ◉ @stream-io/video-client

? What kind of change is this?
  ◉ patch

? Please enter a summary:
Update dependencies to latest versions
```

### Cross-Package Dependencies

If you change `client` or `react-bindings`, their dependent packages (`react-sdk`, `react-native-sdk`) will automatically get bumped by Changesets. You don't need to manually create changesets for them.

**Example:**

```bash
# You only need to create changeset for client
yarn changeset
# Select: @stream-io/video-client
# Type: minor

# When versioning happens:
# - client bumps to 1.40.0
# - react-sdk automatically bumps to 1.30.1 (patch) with dependency update
# - react-native-sdk automatically bumps to 1.26.6 (patch) with dependency update
```

## Changeset File Format

Changesets are markdown files in `.changeset/` directory:

**.changeset/cool-feature.md:**

```markdown
---
'@stream-io/video-client': minor
---

Add support for custom video layouts

This allows developers to create custom participant layouts
by providing a layout configuration object.
```

## Multiple Changesets Per PR

You can create multiple changesets in one PR if needed:

```bash
# First change
yarn changeset
# Summary: "Add feature X"

# Second unrelated change
yarn changeset
# Summary: "Fix bug Y"
```

Both changeset files will be included in the PR.

## Reviewing Changesets

When reviewing PRs:

1. **Check the changeset exists** - CI will fail if missing
2. **Verify version bump type** - Is major/minor/patch correct?
3. **Read the summary** - Will this make sense in the changelog?
4. **Check packages selected** - Are all affected packages included?

## Release Workflow

Releases are handled by a single GitHub Actions workflow (`.github/workflows/release.yml`) that supports both stable and pre-release versions.

### Publishing Stable Releases

**Workflow:** `.github/workflows/release.yml` (runs automatically on push to `main`)

The release workflow runs automatically on every push to `main`:

1. Automatically exits pre-release mode if currently in one
2. Creates or updates a "Version Packages" PR with all pending changesets
3. Review the PR to verify versions and changelogs
4. Merge the PR to publish to npm with `latest` tag and trigger sample app deployment

### Publishing Pre-releases (Beta/Alpha/RC)

**Workflow:** `.github/workflows/release.yml` (manual trigger)

**Important:** Pre-releases can only be published from non-main branches (feature or release branches).

To publish pre-releases:

1. Switch to a feature or release branch (not `main`)
2. Go to **Actions** → **Release**
3. Click **Run workflow**
4. Select the current branch
5. Select release type: `prerelease`
6. Select pre-release tag: `rc` (default), `beta`, or `alpha`
7. Click **Run workflow**

The workflow will:

- On first run: Automatically enter pre-release mode
- Version packages with pre-release tag (e.g., `1.40.0-beta.0`)
- Publish directly to npm with selected tag (not `latest`)
- For subsequent releases, just run the workflow again - it stays in pre-release mode

Users can install pre-releases with:

```bash
yarn add @stream-io/video-client@beta
```

**Note:** You don't need to do anything special when creating changesets. The same changesets work for both pre-releases and stable releases.

## Troubleshooting

### "No changesets found" warning

If CI fails with "No changesets found", you need to create one:

```bash
yarn changeset
```

Then commit the generated `.changeset/*.md` file.

Keep in mind that not every PR needs a changeset, so this warning might be expected.

### Forgot to create changeset before pushing

No problem! Create the changeset and push another commit:

```bash
yarn changeset
git add .changeset/*.md
git commit -m "Add missing changeset for PR #XYZ"
git push
```

### Created changeset with wrong version type

Modify the content of the existing changeset file directly.

### Need to change changeset summary

Edit the `.changeset/*.md` file directly and commit the change.

### Tips

- If you're not sure what packages your changeset/s might affect, run `yarn changeset version` in the root of the monorepo and check all the affected packages. If you're satisfied, revert the changes (_DO NOT PUSH THESE_, the changeset bot will take care of them). Adjust changesets accordingly if not satisfied.

## Learn More

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org/)
