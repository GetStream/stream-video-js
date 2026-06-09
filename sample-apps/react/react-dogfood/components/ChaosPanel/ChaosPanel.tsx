import { useEffect, useState } from 'react';
import {
  type ChaosState,
  type CoordinatorMode,
  type CoordinatorWsMode,
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

const COORD_WS_MODES: Mode<CoordinatorWsMode>[] = [
  { value: 'off', label: 'Off (passthrough)' },
  {
    value: 'fail-always',
    label: 'Always close → exhaust retries → CoordinatorWS connect failure',
  },
  {
    value: 'fail-then-succeed',
    label:
      'Close N times then succeed → CoordinatorWS connects with retry_count_attempt: N',
    withN: true,
  },
  {
    value: 'auth-error',
    label:
      'Auth error (close 4401) → CoordinatorWS connect failure — checks whether the status is forwarded vs generic NETWORK_OFFLINE',
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
  {
    value: 'sfu-unauthenticated',
    label:
      'SFU UNAUTHENTICATED on join → WSJoin completed/failure with code=UNAUTHENTICATED',
  },
  {
    value: 'sfu-go-away',
    label:
      'SFU goAway after join → migration (new join_attempt_id, join_reason=migration)',
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
  s.coordinator.mode !== 'off' ||
  s.coordinatorWs.mode !== 'off' ||
  s.ws.mode !== 'off';

export const ChaosPanel = () => {
  const [open, setOpen] = useState(false);
  const state = useChaosState();
  const controller = getChaosController();
  const active = isAnyActive(state);

  return (
    <>
      <button
        type="button"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 10000,
          border: 0,
          borderRadius: 999,
          padding: '12px 14px',
          background: active ? '#ef4444' : '#111827',
          color: '#fff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          cursor: 'pointer',
          fontWeight: 700,
        }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chaos test panel"
      >
        {`🔥 Chaos${active ? ' (ON)' : ''}`}
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.35)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(560px, 100vw)',
              height: '100%',
              overflow: 'auto',
              background: '#ffffff',
              boxShadow: '-18px 0 40px rgba(15, 23, 42, 0.18)',
              padding: 20,
            }}
          >
            <header
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 22 }}>Chaos Test Panel</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  border: 0,
                  background: 'transparent',
                  fontSize: 24,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </header>

            <p style={{ marginTop: 0, color: '#475569', lineHeight: 1.5 }}>
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
              title="CoordinatorWS (/video/connect)"
              description="Inject open failures on the coordinator WebSocket connection."
              modes={COORD_WS_MODES}
              state={state.coordinatorWs}
              onSelect={controller.setCoordinatorWs}
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

            <footer style={{ marginTop: 20 }}>
              <button
                type="button"
                onClick={controller.reset}
                style={{
                  border: 0,
                  borderRadius: 10,
                  padding: '10px 14px',
                  background: '#e2e8f0',
                  color: '#0f172a',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
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
    <section style={{ marginTop: 24 }}>
      <h3 style={{ marginBottom: 6, fontSize: 17 }}>{title}</h3>
      <p style={{ marginTop: 0, color: '#475569', lineHeight: 1.5 }}>
        {description}
      </p>
      <div style={{ display: 'grid', gap: 10 }}>
        {modes.map((m) => (
          <div
            key={m.value}
            style={{
              display: 'grid',
              gridTemplateColumns: m.withN ? '1fr auto' : '1fr',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(m.value, n)}
              style={{
                border:
                  m.value === state.mode
                    ? '2px solid #dc2626'
                    : '1px solid #cbd5e1',
                borderRadius: 12,
                padding: '12px 14px',
                textAlign: 'left',
                cursor: 'pointer',
                background: m.value === state.mode ? '#fef2f2' : '#fff',
                color: '#0f172a',
              }}
            >
              {m.label}
            </button>
            {m.withN && (
              <label
                style={{
                  display: 'grid',
                  gap: 6,
                  justifyItems: 'center',
                  color: '#475569',
                  fontSize: 13,
                }}
              >
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
                  style={{
                    width: 72,
                    border: '1px solid #cbd5e1',
                    borderRadius: 10,
                    padding: '8px 10px',
                  }}
                />
              </label>
            )}
          </div>
        ))}
        {showRemaining && (
          <small style={{ color: '#475569' }}>
            Remaining: {state.remaining}
          </small>
        )}
      </div>
    </section>
  );
};
