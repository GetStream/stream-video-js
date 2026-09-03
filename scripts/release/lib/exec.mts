/**
 * Process execution helpers shared by the release scripts. `run` wraps
 * execFileSync with trimmed stdout and an `allowFailure` escape hatch; `gh` is
 * `run` bound to the GitHub CLI.
 *
 * Written as TypeScript executed natively via Node's type stripping (Node 24+).
 */

import { execFileSync } from 'node:child_process';

export interface RunOptions {
  allowFailure?: boolean;
}

// Execute a command, returning trimmed stdout and surfacing failures clearly.
// With allowFailure a non-zero exit (or a missing binary) degrades to '' rather
// than throwing, so optional steps never abort a release that already succeeded.
export function run(
  command: string,
  args: string[],
  { allowFailure = false }: RunOptions = {},
): string {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    if (allowFailure) return '';
    const err = error as { stdout?: unknown; stderr?: unknown };
    const details = [err.stdout, err.stderr].filter(Boolean).join('\n');
    throw new Error(
      `Command failed: ${[command, ...args].join(' ')}\n${details}`,
    );
  }
}

// Run the GitHub CLI (`gh`), returning trimmed stdout. Read paths pass
// allowFailure so a missing gh / network / auth degrades to a fallback.
export function gh(args: string[], options: RunOptions = {}): string {
  return run('gh', args, options);
}
