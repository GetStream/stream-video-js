/**
 * Bottom toolbar: tool selection, color palette, clear (confirmed), and zoom
 * controls. Fully keyboard-operable; the active tool and color use aria-pressed
 * plus a selected outline so state is never conveyed by color alone.
 */
import { type ReactNode, useState } from 'react';
import { useI18n } from '@stream-io/video-react-sdk';

import type { Tool } from './core/model';
import { WHITEBOARD_PALETTE } from './useWhiteboard';

interface WhiteboardToolbarProps {
  activeTool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  onClear: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
  zoom: number;
}

const PenIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      d="M4 20h4l10-10-4-4L4 16v4zM14.5 5.5l4 4 1.8-1.8a1.5 1.5 0 0 0 0-2.1l-1.9-1.9a1.5 1.5 0 0 0-2.1 0L14.5 5.5z"
      fill="currentColor"
    />
  </svg>
);

const LineIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M4 20 20 4" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const RectIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <rect
      x="4"
      y="6"
      width="16"
      height="12"
      rx="1"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

const TextIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M5 5h14v3h-2V7h-4v10h2v2H9v-2h2V7H7v1H5V5z" fill="currentColor" />
  </svg>
);

const HandIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
    <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

const EraserIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      d="M7 17 3.5 13.5a1.5 1.5 0 0 1 0-2.1l8-8a1.5 1.5 0 0 1 2.1 0l4.5 4.5a1.5 1.5 0 0 1 0 2.1L13 17H8z"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
    />
    <path d="M13 20h7" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const ZoomInIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <circle
      cx="10"
      cy="10"
      r="6"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M14.5 14.5 20 20M10 7v6M7 10h6"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

const ZoomOutIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <circle
      cx="10"
      cy="10"
      r="6"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path d="M14.5 14.5 20 20M7 10h6" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const FitIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

const ClearIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      d="M6 7h12M9 7V5h6v2M7 7l1 12h8l1-12"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

export const WhiteboardToolbar = (props: WhiteboardToolbarProps) => {
  const {
    activeTool,
    setTool,
    color,
    setColor,
    onClear,
    onZoomIn,
    onZoomOut,
    onReset,
    onFit,
    zoom,
  } = props;
  const { t } = useI18n();
  const [confirmingClear, setConfirmingClear] = useState(false);

  const tools: { tool: Tool; label: string; icon: ReactNode }[] = [
    { tool: 'pen', label: t('Pen'), icon: <PenIcon /> },
    { tool: 'line', label: t('Line'), icon: <LineIcon /> },
    { tool: 'rect', label: t('Rectangle'), icon: <RectIcon /> },
    { tool: 'text', label: t('Text'), icon: <TextIcon /> },
    { tool: 'eraser', label: t('Eraser'), icon: <EraserIcon /> },
    { tool: 'pan', label: t('Pan'), icon: <HandIcon /> },
  ];

  return (
    <div
      className="rd__whiteboard__toolbar"
      role="toolbar"
      aria-label={t('Whiteboard tools')}
    >
      <div className="rd__whiteboard__tool-group">
        {tools.map(({ tool, label, icon }) => (
          <button
            key={tool}
            type="button"
            className="rd__whiteboard__tool"
            aria-pressed={activeTool === tool}
            aria-label={label}
            title={label}
            data-active={activeTool === tool}
            onClick={() => setTool(tool)}
          >
            {icon}
          </button>
        ))}
      </div>

      <div
        className="rd__whiteboard__tool-group rd__whiteboard__tool-group--colors"
        role="group"
        aria-label={t('Color')}
      >
        {WHITEBOARD_PALETTE.map(({ name, value }) => (
          <button
            key={value}
            type="button"
            className="rd__whiteboard__swatch"
            aria-pressed={color === value}
            aria-label={name}
            title={name}
            data-active={color === value}
            style={{ backgroundColor: value }}
            onClick={() => setColor(value)}
          />
        ))}
      </div>

      <div className="rd__whiteboard__tool-group">
        <button
          type="button"
          className="rd__whiteboard__tool"
          aria-label={t('Zoom out')}
          title={t('Zoom out')}
          onClick={onZoomOut}
        >
          <ZoomOutIcon />
        </button>
        <button
          type="button"
          className="rd__whiteboard__zoom-label"
          aria-label={t('Reset zoom')}
          title={t('Reset zoom')}
          onClick={onReset}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          className="rd__whiteboard__tool"
          aria-label={t('Zoom in')}
          title={t('Zoom in')}
          onClick={onZoomIn}
        >
          <ZoomInIcon />
        </button>
        <button
          type="button"
          className="rd__whiteboard__tool"
          aria-label={t('Fit to content')}
          title={t('Fit to content')}
          onClick={onFit}
        >
          <FitIcon />
        </button>
      </div>

      <div className="rd__whiteboard__tool-group">
        {confirmingClear ? (
          <div className="rd__whiteboard__confirm" role="group">
            <span className="rd__whiteboard__confirm-label">
              {t('Clear for everyone?')}
            </span>
            <button
              type="button"
              className="rd__button rd__button--secondary"
              onClick={() => setConfirmingClear(false)}
            >
              {t('Cancel')}
            </button>
            <button
              type="button"
              className="rd__button rd__whiteboard__confirm-clear"
              onClick={() => {
                onClear();
                setConfirmingClear(false);
              }}
            >
              {t('Clear')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="rd__whiteboard__tool rd__whiteboard__tool--danger"
            aria-label={t('Clear whiteboard')}
            title={t('Clear whiteboard')}
            onClick={() => setConfirmingClear(true)}
          >
            <ClearIcon />
          </button>
        )}
      </div>
    </div>
  );
};
