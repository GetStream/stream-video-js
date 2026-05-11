import { useEffect, useState } from 'react';
import {
  type ChaosState,
  type CoordinatorMode,
  type WsMode,
  getChaosController,
} from './chaos';

type Mode<T extends string> = {
  value: T;
  label: string;
  withN?: boolean;
};

const COORD_MODES: Mode<CoordinatorMode>[] = [
  { value: 'off', label: 'Off (passthrough)' },
  {
    value: 'fail-always',
    label: 'Always 503 → exhaust retries → CoordinatorJoin completed/failure',
  },
  {
    value: 'fail-then-succeed',
    label:
      'Fail N times then succeed → CoordinatorJoin completed/success with retry_count_attempt: N',
    withN: true,
  },
];

const WS_MODES: Mode<WsMode>[] = [
  { value: 'off', label: 'Off (passthrough)' },
  {
    value: 'fail-always',
    label: 'Always close → WSJoin completed/failure after retries',
  },
  {
    value: 'fail-then-succeed',
    label:
      'Close N times then succeed → WSJoin completed/success with retry_count_attempt: N',
    withN: true,
  },
  {
    value: 'sfu-full-always',
    label:
      'Always SFU_FULL → migrate every retry → WSJoin completed/failure with code=SFU_FULL each attempt',
  },
  {
    value: 'sfu-full-then-succeed',
    label:
      'SFU_FULL N times then succeed → N WSJoin completed/failure (SFU_FULL) + final WSJoin completed/success',
    withN: true,
  },
];

const useChaosState = (): ChaosState => {
  const controller = getChaosController();
  const [state, setState] = useState(() => controller.getState());
  useEffect(
    () => controller.subscribe(() => setState(controller.getState())),
    [controller],
  );
  return state;
};

const isAnyActive = (s: ChaosState) =>
  s.coordinator.mode !== 'off' || s.ws.mode !== 'off';

export const ChaosPanel = () => {
  const [open, setOpen] = useState(false);
  const state = useChaosState();
  const controller = getChaosController();
  const active = isAnyActive(state);

  return (
    <>
      <button
        type="button"
        className={`rd__chaos-fab${active ? ' rd__chaos-fab--active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chaos test panel"
      >
        🔥 Chaos {active ? '(ON)' : ''}
      </button>
      {open && (
        <div className="rd__chaos-overlay" onClick={() => setOpen(false)}>
          <div className="rd__chaos-panel" onClick={(e) => e.stopPropagation()}>
            <header className="rd__chaos-panel__header">
              <h2>Chaos Test Panel</h2>
              <button
                type="button"
                className="rd__chaos-panel__close"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </header>

            <p className="rd__chaos-panel__hint">
              Apply scenarios <strong>before</strong> joining a call. Reset to
              clear.
            </p>

            <Section
              title="CoordinatorJoin (HTTP /join)"
              description="Inject 503 responses to /call/{type}/{id}/join."
              modes={COORD_MODES}
              state={state.coordinator}
              onSelect={controller.setCoordinator}
            />
            <Section
              title="WSJoin (SFU WebSocket)"
              description={
                'Inject WS-stage failures. "close" simulates transport failure; ' +
                '"SFU_FULL" simulates the SFU returning a join-error code over the open WS.'
              }
              modes={WS_MODES}
              state={state.ws}
              onSelect={controller.setWs}
            />

            <footer className="rd__chaos-panel__footer">
              <button
                type="button"
                className="rd__chaos-btn rd__chaos-btn--reset"
                onClick={controller.reset}
              >
                Reset all
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
};

type SectionProps<T extends string> = {
  title: string;
  description: string;
  modes: Mode<T>[];
  state: { mode: T; failCount: number; remaining: number };
  onSelect: (mode: T, failCount: number) => void;
};

const Section = <T extends string>({
  title,
  description,
  modes,
  state,
  onSelect,
}: SectionProps<T>) => {
  const [n, setN] = useState(state.failCount);
  const showRemaining = state.mode.endsWith('-then-succeed');

  return (
    <section className="rd__chaos-section">
      <h3>{title}</h3>
      <p className="rd__chaos-section__description">{description}</p>
      <div className="rd__chaos-section__buttons">
        {modes.map((m) => (
          <div className="rd__chaos-row" key={m.value}>
            <button
              type="button"
              className={`rd__chaos-btn${
                m.value === state.mode ? ' rd__chaos-btn--active' : ''
              }`}
              onClick={() => onSelect(m.value, n)}
            >
              {m.label}
            </button>
            {m.withN && (
              <label className="rd__chaos-number">
                <span>N</span>
                <input
                  type="number"
                  value={n}
                  min={1}
                  max={5}
                  onChange={(e) =>
                    setN(
                      Math.max(
                        1,
                        Math.min(5, parseInt(e.target.value, 10) || 1),
                      ),
                    )
                  }
                />
              </label>
            )}
          </div>
        ))}
        {showRemaining && (
          <small className="rd__chaos-status">
            Remaining: {state.remaining}
          </small>
        )}
      </div>
    </section>
  );
};
