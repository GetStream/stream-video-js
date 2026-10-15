import type {
  BattlecardEvent,
  BattlecardObjectionEvent,
  CallRecapEvent,
  CoachNudgeEvent,
  CrossSellEvent,
  DealSheetEvent,
  DocsSuggestionEvent,
  FollowupTaskEvent,
  IssueDetectedEvent,
  NoticeEvent,
  ObjectionEvent,
  PersonaInsightEvent,
  PersonaSummary,
  PlanFitEvent,
  SlackAnswerReceivedEvent,
  SlackQuestionPostedEvent,
  TranscriptSegmentEvent,
  WorkflowStepEvent,
  WorkflowStepName,
  WwsdEvent,
} from './types';

export const CHAT_TEAM_CARD_ID = 'chat-team';
export const FIX_IT_LIVE_CARD_ID = 'fix-it-live';

type Keyed<K extends string, E> = { id: string; ts: number; kind: K; event: E };

export type CardEntry =
  | Keyed<'issue', IssueDetectedEvent>
  | Keyed<'docs', DocsSuggestionEvent>
  | Keyed<'battlecard', BattlecardEvent>
  | Keyed<'battlecard-objection', BattlecardObjectionEvent>
  | Keyed<'objection', ObjectionEvent>
  | Keyed<'plan-fit', PlanFitEvent>
  | Keyed<'cross-sell', CrossSellEvent>
  | Keyed<'persona-insight', PersonaInsightEvent>
  | { id: typeof CHAT_TEAM_CARD_ID; ts: number; kind: 'chat-team' }
  | { id: typeof FIX_IT_LIVE_CARD_ID; ts: number; kind: 'fix-it-live' };

export type SlackState = {
  draft?: string;
  posted?: SlackQuestionPostedEvent;
  answer?: SlackAnswerReceivedEvent;
};

export type WorkflowState = Partial<
  Record<WorkflowStepName, WorkflowStepEvent>
>;

export type WwsdState = {
  transcript: TranscriptSegmentEvent[];
  /** Newest first. */
  cards: CardEntry[];
  dealSheet: DealSheetEvent | null;
  personas: PersonaSummary[];
  /** persona id -> why the copilot suggests it */
  suggestedPersonas: Record<string, string>;
  slack: SlackState | null;
  workflow: WorkflowState | null;
  coachNudge: CoachNudgeEvent | null;
  notice: NoticeEvent | null;
  recap: CallRecapEvent | null;
  followupTask: FollowupTaskEvent | null;
};

export type WwsdAction =
  { kind: 'reset' } | { kind: 'event'; event: WwsdEvent };

export const initialWwsdState: WwsdState = {
  transcript: [],
  cards: [],
  dealSheet: null,
  personas: [],
  suggestedPersonas: {},
  slack: null,
  workflow: null,
  coachNudge: null,
  notice: null,
  recap: null,
  followupTask: null,
};

const TRANSCRIPT_LIMIT = 20;

/** Changes when a card is updated, so a dismissed card comes back on news. */
export const cardKey = (card: CardEntry) => `${card.id}@${card.ts}`;

const pushCard = (cards: CardEntry[], card: CardEntry) => [
  card,
  ...cards.filter((c) => c.id !== card.id),
];

const eventCard = <K extends string, E extends WwsdEvent>(kind: K, event: E) =>
  ({ id: `${event.type}:${event.ts}`, ts: event.ts, kind, event }) as const;

const upsertTranscript = (
  transcript: TranscriptSegmentEvent[],
  segment: TranscriptSegmentEvent,
) => {
  const next = [...transcript];
  // findLastIndex is ES2023; the app's lib is es2022
  let partialIndex = -1;
  for (let i = next.length - 1; i >= 0; i--) {
    if (next[i].speaker === segment.speaker && !next[i].final) {
      partialIndex = i;
      break;
    }
  }
  if (partialIndex >= 0) next[partialIndex] = segment;
  else next.push(segment);
  return next.slice(-TRANSCRIPT_LIMIT);
};

export const wwsdReducer = (
  state: WwsdState,
  action: WwsdAction,
): WwsdState => {
  if (action.kind === 'reset') return initialWwsdState;
  const event = action.event;
  switch (event.type) {
    case 'transcript.segment':
      return {
        ...state,
        transcript: upsertTranscript(state.transcript, event),
      };
    case 'issue.detected':
      return {
        ...state,
        cards: pushCard(state.cards, eventCard('issue', event)),
      };
    case 'docs.suggestion':
      return {
        ...state,
        cards: pushCard(state.cards, eventCard('docs', event)),
      };
    case 'battlecard':
      return {
        ...state,
        cards: pushCard(state.cards, eventCard('battlecard', event)),
      };
    case 'battlecard.objection':
      return {
        ...state,
        cards: pushCard(state.cards, eventCard('battlecard-objection', event)),
      };
    case 'objection':
      return {
        ...state,
        cards: pushCard(state.cards, eventCard('objection', event)),
      };
    case 'plan.fit':
      return {
        ...state,
        cards: pushCard(state.cards, eventCard('plan-fit', event)),
      };
    case 'cross_sell':
      return {
        ...state,
        cards: pushCard(state.cards, eventCard('cross-sell', event)),
      };
    case 'persona.insight':
      return {
        ...state,
        cards: pushCard(state.cards, eventCard('persona-insight', event)),
      };
    case 'slack.question.draft':
      return {
        ...state,
        slack: { draft: event.text },
        cards: pushCard(state.cards, {
          id: CHAT_TEAM_CARD_ID,
          ts: event.ts,
          kind: 'chat-team',
        }),
      };
    case 'slack.question.posted':
      return {
        ...state,
        slack: { posted: event },
        cards: pushCard(state.cards, {
          id: CHAT_TEAM_CARD_ID,
          ts: event.ts,
          kind: 'chat-team',
        }),
      };
    case 'slack.answer.received':
      return {
        ...state,
        slack: { ...state.slack, answer: event },
        cards: pushCard(state.cards, {
          id: CHAT_TEAM_CARD_ID,
          ts: event.ts,
          kind: 'chat-team',
        }),
      };
    case 'workflow.step':
      return {
        ...state,
        // a new run starts with the ticket step
        workflow: {
          ...(event.step === 'ticket' ? {} : state.workflow),
          [event.step]: event,
        },
        cards: pushCard(state.cards, {
          id: FIX_IT_LIVE_CARD_ID,
          ts: event.ts,
          kind: 'fix-it-live',
        }),
      };
    case 'deal.sheet':
      return { ...state, dealSheet: event };
    case 'persona.suggested':
      return {
        ...state,
        suggestedPersonas: {
          ...state.suggestedPersonas,
          [event.persona]: event.reason,
        },
      };
    case 'personas.updated':
      return { ...state, personas: event.personas ?? [] };
    case 'coach.nudge':
      return { ...state, coachNudge: event };
    case 'notice':
      return { ...state, notice: event };
    case 'call.recap':
      return { ...state, recap: event };
    case 'followup.task':
      return { ...state, followupTask: event };
    default:
      return state;
  }
};

export const isWorkflowRunning = (workflow: WorkflowState | null) =>
  !!workflow &&
  !workflow.done &&
  !Object.values(workflow).some((step) => step?.status === 'failed');
