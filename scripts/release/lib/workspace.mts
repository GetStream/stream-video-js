/**
 * Workspace package discovery shared by the release scripts. Maps every package
 * under packages/ to its directory and parsed package.json manifest.
 *
 * Written as TypeScript executed natively via Node's type stripping (Node 24+).
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface PackageManifest {
  name?: string;
  private?: boolean;
  dependencies?: Record<string, string>;
}

export interface WorkspacePackage {
  dir: string;
  manifest: PackageManifest;
}

export type Workspace = Map<string, WorkspacePackage>;

// Map every workspace package name to its directory and parsed manifest.
export function loadWorkspacePackages(packagesDir: string): Workspace {
  const map: Workspace = new Map();
  for (const entry of readdirSync(packagesDir)) {
    const manifestPath = join(packagesDir, entry, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(
      readFileSync(manifestPath, 'utf8'),
    ) as PackageManifest;
    if (manifest.name) {
      map.set(manifest.name, { dir: join(packagesDir, entry), manifest });
    }
  }
  return map;
}
