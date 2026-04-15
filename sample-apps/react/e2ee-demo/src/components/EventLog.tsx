import { useEffect, useRef } from 'react';
import type { EventLogEntry } from '../types';
import './EventLog.css';

const TYPE_LABELS: Record<EventLogEntry['type'], string> = {
  'key-set': '🔑',
  'key-rotate': '🔄',
  'key-distribute': '📤',
  join: '✅',
  leave: '👋',
  error: '❌',
  perf: '📊',
};

export const EventLog = ({ entries }: { entries: EventLogEntry[] }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="event-log">
      <div className="event-log__header">Event Log</div>
      <div className="event-log__entries">
        {entries.length === 0 && (
          <div className="event-log__empty">
            Add a participant to get started
          </div>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`event-log__entry event-log__entry--${entry.type}`}
          >
            <span className="event-log__icon">{TYPE_LABELS[entry.type]}</span>
            <span className="event-log__time">
              {entry.timestamp.toLocaleTimeString()}
            </span>
            <span className="event-log__message">{entry.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
