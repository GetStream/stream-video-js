/**
 * Call-scoped whiteboard hook. Mounted once at the ActiveCall level so the
 * document and sync run for the whole call, not just while the board is open:
 * ops keep applying, late joiners can be answered, and the snapshot-responder
 * role survives a closed board. Instances are created fresh per effect run so
 * React Strict Mode's mount/unmount/remount cycle stays correct.
 *
 * The document is read imperatively by the canvas, never through React state;
 * the hook only holds coarse UI state (open flag, active tool, color, notice).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CallingState,
  type Logger,
  logToConsole,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import { SceneStore } from './core/SceneStore';
import type { Tool } from './core/model';
import { Sequencer, type ToolStyle } from './core/tools';
import { WhiteboardSync } from './sync/WhiteboardSync';

// Chosen for legibility on the fixed light board surface (#f7f7f4); no near-white
// values. Black stays first so it remains the default stroke color.
export const WHITEBOARD_PALETTE = [
  { name: 'Black', value: '#2e2e2e' },
  { name: 'Grey', value: '#868e96' },
  { name: 'Red', value: '#e03131' },
  { name: 'Orange', value: '#e8590c' },
  { name: 'Gold', value: '#c9920a' },
  { name: 'Green', value: '#2f9e44' },
  { name: 'Teal', value: '#0c8599' },
  { name: 'Blue', value: '#1971c2' },
  { name: 'Indigo', value: '#3b5bdb' },
  { name: 'Violet', value: '#7048e8' },
  { name: 'Pink', value: '#e64980' },
  { name: 'Brown', value: '#846358' },
] as const;

export const DEFAULT_WHITEBOARD_COLOR = WHITEBOARD_PALETTE[0].value;
export const DEFAULT_STROKE_WIDTH = 3;
const NOTICE_TIMEOUT_MS = 4000;

interface Instances {
  store: SceneStore;
  sequencer: Sequencer;
  sync: WhiteboardSync;
}

export interface WhiteboardApi {
  ready: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  clear: () => void;
  activeTool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  /** Transient message naming a remote actor who opened/closed the board. */
  notice: string | null;
  store: SceneStore | null;
  sync: WhiteboardSync | null;
  sequencer: Sequencer | null;
  getStyle: () => ToolStyle;
}

export const useWhiteboard = (): WhiteboardApi => {
  const call = useCall();
  const { useLocalParticipant, useCallCallingState } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const sessionId = localParticipant?.sessionId;
  const callingState = useCallCallingState();

  const logger = useMemo<Logger>(
    () =>
      (level, message, ...args) =>
        logToConsole(level, `[whiteboard] ${message}`, ...args),
    [],
  );

  const [instances, setInstances] = useState<Instances | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [color, setColor] = useState<string>(DEFAULT_WHITEBOARD_COLOR);
  const [notice, setNotice] = useState<string | null>(null);

  const styleRef = useRef<ToolStyle>({
    color: DEFAULT_WHITEBOARD_COLOR,
    width: DEFAULT_STROKE_WIDTH,
  });
  useEffect(() => {
    styleRef.current = { color, width: DEFAULT_STROKE_WIDTH };
  }, [color]);
  const getStyle = useCallback(() => styleRef.current, []);

  useEffect(() => {
    if (!call || !sessionId) return;
    const store = new SceneStore();
    const sequencer = new Sequencer(sessionId);
    const sync = new WhiteboardSync(call, sessionId, store, logger);
    sync.start();
    setInstances({ store, sequencer, sync });
    return () => {
      sync.dispose();
      setInstances(null);
    };
  }, [call, sessionId, logger]);

  useEffect(() => {
    if (!instances) return;
    setIsOpen(instances.sync.isOpen());
    return instances.sync.subscribeOpen((open, actor) => {
      setIsOpen(open);
      if (actor) {
        setNotice(`${actor.name} ${open ? 'opened' : 'closed'} the whiteboard`);
      }
    });
  }, [instances]);

  useEffect(() => {
    if (!notice) return;
    const handle = setTimeout(() => setNotice(null), NOTICE_TIMEOUT_MS);
    return () => clearTimeout(handle);
  }, [notice]);

  const prevCallingState = useRef(callingState);
  useEffect(() => {
    const prev = prevCallingState.current;
    prevCallingState.current = callingState;
    if (
      instances &&
      prev === CallingState.RECONNECTING &&
      callingState === CallingState.JOINED
    ) {
      instances.sync.onReconnected();
    }
  }, [callingState, instances]);

  const open = useCallback(() => instances?.sync.setOpen(true), [instances]);
  const close = useCallback(() => instances?.sync.setOpen(false), [instances]);
  const clear = useCallback(() => {
    if (!instances) return;
    instances.sync.applyLocalOp({
      op: 'clear',
      epoch: instances.store.getEpoch() + 1,
    });
  }, [instances]);

  return {
    ready: !!instances,
    isOpen,
    open,
    close,
    clear,
    activeTool,
    setTool: setActiveTool,
    color,
    setColor,
    notice,
    store: instances?.store ?? null,
    sync: instances?.sync ?? null,
    sequencer: instances?.sequencer ?? null,
    getStyle,
  };
};
