import * as darkSource from './dark/StreamTokens';
import * as lightSource from './light/StreamTokens';
import { resolveTokenGroup } from './resolveTokenGroup';
import type { IStreamTokens } from './StreamTokens.types';

export type { IStreamTokens, RNShadowToken } from './StreamTokens.types';

/**
 * The design tokens for a single theme, with every internal reference resolved.
 *
 * @internal not part of the public API yet: the redesign is still consuming
 * these directly while the themed component API is being reworked.
 */
export type StreamTokens = IStreamTokens;

const buildTokens = (source: IStreamTokens): StreamTokens => ({
  foundations: source.foundations,
  primitives: source.primitives,
  components: source.components,
  // the only group the generator leaves with unresolved self references
  semantics: resolveTokenGroup(source.semantics),
});

/**
 * @internal
 */
export const lightTokens = buildTokens(lightSource);

/**
 * @internal
 */
export const darkTokens = buildTokens(darkSource);

/**
 * @internal
 */
export const tokens = {
  light: lightTokens,
  dark: darkTokens,
} satisfies Record<'light' | 'dark', StreamTokens>;

/**
 * @internal
 */
export type TokenColorScheme = keyof typeof tokens;
