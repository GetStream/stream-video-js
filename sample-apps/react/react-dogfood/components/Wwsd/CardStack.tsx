import { useEffect, useState } from 'react';
import {
  BattlecardCard,
  BattlecardObjectionCard,
  CrossSellCard,
  ObjectionCard,
  PlanFitCard,
} from './cards/SellingCards';
import { ChatTeamCard } from './cards/ChatTeamCard';
import { DocsCard, IssueCard, PersonaCard } from './cards/InsightCards';
import { FixItLiveCard } from './cards/FixItLiveCard';
import type { CardEntry } from './reducer';
import { useWwsd } from './WwsdContext';

const NUDGE_VISIBLE_S = 10;

const CoachNudge = () => {
  const { state } = useWwsd();
  const nudge = state.coachNudge;
  const [hiddenTs, setHiddenTs] = useState<number | null>(null);

  useEffect(() => {
    if (!nudge) return;
    const remainingMs = (nudge.ts + NUDGE_VISIBLE_S) * 1000 - Date.now();
    const id = setTimeout(
      () => setHiddenTs(nudge.ts),
      Math.max(0, remainingMs),
    );
    return () => clearTimeout(id);
  }, [nudge]);

  if (!nudge || hiddenTs === nudge.ts) return null;
  return <div className="rd__wwsd-nudge">💡 {nudge.text}</div>;
};

const renderCard = (card: CardEntry, onDismiss: () => void) => {
  switch (card.kind) {
    case 'issue':
      return <IssueCard event={card.event} onDismiss={onDismiss} />;
    case 'docs':
      return <DocsCard event={card.event} onDismiss={onDismiss} />;
    case 'battlecard':
      return <BattlecardCard event={card.event} onDismiss={onDismiss} />;
    case 'battlecard-objection':
      return (
        <BattlecardObjectionCard event={card.event} onDismiss={onDismiss} />
      );
    case 'objection':
      return <ObjectionCard event={card.event} onDismiss={onDismiss} />;
    case 'plan-fit':
      return <PlanFitCard event={card.event} onDismiss={onDismiss} />;
    case 'cross-sell':
      return <CrossSellCard event={card.event} onDismiss={onDismiss} />;
    case 'persona-insight':
      return <PersonaCard event={card.event} onDismiss={onDismiss} />;
    case 'chat-team':
      return <ChatTeamCard onDismiss={onDismiss} />;
    case 'fix-it-live':
      return <FixItLiveCard onDismiss={onDismiss} />;
  }
};

export const CardStack = () => {
  const { state, isDismissed, dismissCard } = useWwsd();
  return (
    <>
      <CoachNudge />
      {state.cards
        .filter((card) => !isDismissed(card))
        .map((card) => (
          <div key={card.id}>{renderCard(card, () => dismissCard(card))}</div>
        ))}
    </>
  );
};
