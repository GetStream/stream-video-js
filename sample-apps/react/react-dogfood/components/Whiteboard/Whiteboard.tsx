/**
 * Whiteboard stage: centered canvas + bottom toolbar + right-side participants
 * strip. Laid out like CallParticipantsScreenView (screen-share takeover), and
 * mounted only while the board is open. Keyboard shortcuts: P/L/R/T select
 * tools; Ctrl/Cmd +/-/0 control zoom.
 */
import { useEffect, useRef, useState } from 'react';
import {
  DefaultParticipantViewUI,
  IconButton,
  ParticipantView,
  useCall,
  useCallStateHooks,
  useVerticalScrollPosition,
} from '@stream-io/video-react-sdk';

import type { Tool } from './core/model';
import {
  WhiteboardCanvas,
  type WhiteboardCanvasHandle,
} from './WhiteboardCanvas';
import { WhiteboardToolbar } from './WhiteboardToolbar';
import type { WhiteboardApi } from './useWhiteboard';

const SHORTCUT_TOOLS: Record<string, Tool> = {
  p: 'pen',
  l: 'line',
  r: 'rect',
  t: 'text',
  e: 'eraser',
  h: 'pan',
};

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
};

const WhiteboardParticipants = () => {
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const [scrollWrapper, setScrollWrapper] = useState<HTMLDivElement | null>(
    null,
  );

  useEffect(() => {
    if (!scrollWrapper || !call) return;
    const cleanup = call.setViewport(scrollWrapper);
    return () => cleanup?.();
  }, [scrollWrapper, call]);

  const scrollPosition = useVerticalScrollPosition(scrollWrapper);

  return (
    <div className="rd__whiteboard__participants">
      {scrollPosition && scrollPosition !== 'top' && (
        <IconButton
          icon="caret-up"
          onClick={() =>
            scrollWrapper?.scrollBy({ top: -150, behavior: 'smooth' })
          }
        />
      )}
      <div
        ref={setScrollWrapper}
        className="rd__whiteboard__participants-scroll"
      >
        {participants.map((participant) => (
          <ParticipantView
            key={participant.sessionId}
            participant={participant}
            ParticipantViewUI={DefaultParticipantViewUI}
          />
        ))}
      </div>
      {scrollPosition && scrollPosition !== 'bottom' && (
        <IconButton
          icon="caret-down"
          onClick={() =>
            scrollWrapper?.scrollBy({ top: 150, behavior: 'smooth' })
          }
        />
      )}
    </div>
  );
};

export const Whiteboard = (props: { wb: WhiteboardApi }) => {
  const { wb } = props;
  const [zoom, setZoom] = useState(1);
  const handleRef = useRef<WhiteboardCanvasHandle | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.ctrlKey || event.metaKey) {
        if (event.key === '=' || event.key === '+') {
          event.preventDefault();
          handleRef.current?.zoomIn();
        } else if (event.key === '-') {
          event.preventDefault();
          handleRef.current?.zoomOut();
        } else if (event.key === '0') {
          event.preventDefault();
          handleRef.current?.reset();
        }
        return;
      }
      const tool = SHORTCUT_TOOLS[event.key.toLowerCase()];
      if (tool) {
        event.preventDefault();
        wb.setTool(tool);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [wb]);

  return (
    <div className="rd__whiteboard">
      <div className="rd__whiteboard__stage">
        <WhiteboardCanvas
          wb={wb}
          handleRef={handleRef}
          onZoomChange={setZoom}
        />
        <WhiteboardToolbar
          activeTool={wb.activeTool}
          setTool={wb.setTool}
          color={wb.color}
          setColor={wb.setColor}
          onClear={wb.clear}
          onZoomIn={() => handleRef.current?.zoomIn()}
          onZoomOut={() => handleRef.current?.zoomOut()}
          onReset={() => handleRef.current?.reset()}
          onFit={() => handleRef.current?.fit()}
          zoom={zoom}
        />
      </div>
      <WhiteboardParticipants />
    </div>
  );
};
