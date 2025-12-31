import { ParticipantViewProps } from '../../ParticipantView';
import { ParticipantFilter, ParticipantPredicate } from '../hooks';

export type PipLayoutProps = {
  /**
   * Whether to exclude the local participant from the grid.
   * @default false
   */
  excludeLocalParticipant?: boolean;

  /**
   * Predicate to filter call participants or a filter object.
   * @example
   * // With a predicate:
   * <PipLayout.Pip
   *   filterParticipants={p => p.roles.includes('student')}
   * />
   * @example
   * // With a filter object:
   * <PipLayout.Pip
   *   filterParticipants={{
   *     $or: [
   *       { roles: { $contains: 'student' } },
   *       { isPinned: true },
   *     ],
   *   }}
   * />
   */
  filterParticipants?: ParticipantPredicate | ParticipantFilter;

  /**
   * When set to `false` disables mirroring of the local participant's video.
   * @default true
   */
  mirrorLocalParticipantVideo?: boolean;
} & Pick<ParticipantViewProps, 'ParticipantViewUI' | 'VideoPlaceholder'>;

export type PipLayoutGridProps = PipLayoutProps & {
  /**
   * The number of participants to display per page.
   * @default 9
   */
  groupSize?: number;

  /**
   * Whether to show pagination arrows when there are multiple pages.
   * @default true
   */
  pageArrowsVisible?: boolean;
};
