// Mirrors internal/events/events.go in GetStream/wwsd. Go nil slices arrive as null.

export type WwsdEventBase = {
  type: string;
  call_id: string;
  ts: number;
};

export type TranscriptSegmentEvent = WwsdEventBase & {
  type: 'transcript.segment';
  speaker: string;
  text: string;
  final: boolean;
};

export type IssueDetectedEvent = WwsdEventBase & {
  type: 'issue.detected';
  summary: string;
  product: string;
  feature: string;
  platform: string;
  severity: string;
  model?: string;
};

export type DocItem = {
  title: string;
  url: string;
  summary: string;
  say_this: string;
};

export type DocsSuggestionEvent = WwsdEventBase & {
  type: 'docs.suggestion';
  items: DocItem[] | null;
};

export type SlackQuestionDraftEvent = WwsdEventBase & {
  type: 'slack.question.draft';
  text: string;
};

export type SlackQuestionPostedEvent = WwsdEventBase & {
  type: 'slack.question.posted';
  text: string;
  permalink: string;
};

export type SlackAnswerReceivedEvent = WwsdEventBase & {
  type: 'slack.answer.received';
  from: string;
  text: string;
  permalink: string;
};

export type PersonaSuggestedEvent = WwsdEventBase & {
  type: 'persona.suggested';
  persona: string;
  reason: string;
};

export type PersonaInsightEvent = WwsdEventBase & {
  type: 'persona.insight';
  persona: string;
  display_name: string;
  emoji: string;
  facts: Record<string, unknown> | null;
  line: string;
  for: 'customer' | 'rep';
  spoken: boolean;
  model?: string;
};

export type PersonaSummary = {
  id: string;
  display_name: string;
  button_label: string;
  emoji: string;
  has_voice: boolean;
};

export type PersonasUpdatedEvent = WwsdEventBase & {
  type: 'personas.updated';
  personas: PersonaSummary[] | null;
};

export type BattlecardRow = {
  axis: string;
  label: string;
  them: string;
  us: string;
  say_this: string;
  caution: string;
  generated: boolean;
  model?: string;
};

export type DiscoveryQuestion = {
  question: string;
  why: string;
};

export type BattlecardEvent = WwsdEventBase & {
  type: 'battlecard';
  competitor: string;
  name: string;
  position: string;
  rows: BattlecardRow[] | null;
  source: string;
  verified: string;
  discovery: DiscoveryQuestion[] | null;
};

export type BattlecardObjectionEvent = WwsdEventBase & {
  type: 'battlecard.objection';
  competitor: string;
  name: string;
  they_say: string;
  you_say: string;
  quote: string;
};

export type ObjectionEvent = WwsdEventBase & {
  type: 'objection';
  objection: string;
  theme: string;
  what_worked: string;
  outcome: string;
  said: string;
  source: string;
  quote: string;
};

export type DealField = {
  signal: string;
  label: string;
  value: string;
  quote: string;
  ask?: string;
  model?: string;
};

export type DealSheetEvent = WwsdEventBase & {
  type: 'deal.sheet';
  fields: DealField[] | null;
  captured: string[] | null;
  products: string[] | null;
};

export type CrossSellEvent = WwsdEventBase & {
  type: 'cross_sell';
  product: string;
  name: string;
  why: string;
  say_this: string;
  docs: string;
  quote: string;
};

export type PlanFitEvent = WwsdEventBase & {
  type: 'plan.fit';
  product: string;
  name: string;
  tier: string;
  price: string;
  say_this: string;
  quote: string;
  source: string;
  verified: string;
};

export type CoachNudgeEvent = WwsdEventBase & {
  type: 'coach.nudge';
  kind: string;
  text: string;
};

export const WORKFLOW_STEPS = [
  'ticket',
  'pickup',
  'fix',
  'pr',
  'approve',
  'deployed',
  'done',
] as const;

export type WorkflowStepName = (typeof WORKFLOW_STEPS)[number];

export type WorkflowStepEvent = WwsdEventBase & {
  type: 'workflow.step';
  step: WorkflowStepName;
  status: 'running' | 'ok' | 'failed';
  url: string;
  detail: string;
};

export type NoticeEvent = WwsdEventBase & {
  type: 'notice';
  level: 'info' | 'warning' | 'error';
  text: string;
};

export type RecapItem = {
  text: string;
  url: string;
};

export type RecapSection = {
  title: string;
  items: RecapItem[] | null;
};

export type CallRecapEvent = WwsdEventBase & {
  type: 'call.recap';
  title: string;
  sections: RecapSection[] | null;
  markdown: string;
  email_to: string;
  email_subject: string;
  email_body: string;
  model?: string;
};

export type FollowupTaskEvent = WwsdEventBase & {
  type: 'followup.task';
  title: string;
  identifier: string;
  url: string;
};

export type WwsdEvent =
  | TranscriptSegmentEvent
  | IssueDetectedEvent
  | DocsSuggestionEvent
  | SlackQuestionDraftEvent
  | SlackQuestionPostedEvent
  | SlackAnswerReceivedEvent
  | PersonaSuggestedEvent
  | PersonaInsightEvent
  | PersonasUpdatedEvent
  | BattlecardEvent
  | BattlecardObjectionEvent
  | ObjectionEvent
  | DealSheetEvent
  | CrossSellEvent
  | PlanFitEvent
  | CoachNudgeEvent
  | WorkflowStepEvent
  | NoticeEvent
  | CallRecapEvent
  | FollowupTaskEvent;

export type JoinLink = {
  role: 'rep' | 'customer';
  user_id: string;
  name: string;
  url: string;
};
