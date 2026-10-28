import { Browsers, type Call } from '@stream-io/video-react-sdk';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

declare global {
  interface Window {
    documentPictureInPicture: {
      requestWindow: (options?: {
        width: number;
        height: number;
      }) => Promise<Window>;
    };
  }
}

export function usePipWindow(key: string, call: Call) {
  const isSupported = 'documentPictureInPicture' in window;
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({
    width: Number.NaN,
    height: Number.NaN,
  });

  if (Number.isNaN(sizeRef.current.width)) {
    const latestSizeStr = localStorage.getItem(key);
    let size = { width: 300, height: 520 };

    if (latestSizeStr) {
      try {
        size = JSON.parse(latestSizeStr);
      } catch {}
    }

    sizeRef.current = size;
  }

  const keyRef = useRef(key);
  keyRef.current = key;

  const pipWindowRef = useRef(pipWindow);
  pipWindowRef.current = pipWindow;

  const open = useCallback(async () => {
    const pw = await window.documentPictureInPicture.requestWindow(
      sizeRef.current,
    );
    copyStylesheetLinks(window.document, pw.document);

    if (Browsers.isFirefox()) {
      call.setCaptureWindow(pw);
    }

    pw.addEventListener('resize', () => {
      sizeRef.current = {
        width: pw.innerWidth,
        height: pw.innerHeight,
      };
    });

    pw.addEventListener('pagehide', () => {
      const enableCamera = Browsers.isFirefox() && call.camera.enabled;
      const enableMic = Browsers.isFirefox() && call.microphone.enabled;

      call.setCaptureWindow(undefined);

      if (enableCamera) {
        call.camera
          .disable()
          .then(() => call.camera.enable())
          .catch((err) => console.warn('Failed to restart camera', err));
      }

      if (enableMic) {
        call.microphone
          .disable()
          .then(() => call.microphone.enable())
          .catch((err) => console.warn('Failed to restart camera', err));
      }
      window.localStorage.setItem(
        keyRef.current,
        JSON.stringify(sizeRef.current),
      );
      setPipWindow(null);
    });

    setPipWindow(pw);
  }, [call]);

  const close = useCallback(() => {
    pipWindow?.close();
  }, [pipWindow]);

  const createPipPortal = useCallback(
    (children: ReactNode, placeholder?: ReactNode) => {
      if (!pipWindow) {
        return null;
      }

      return (
        <>
          {createPortal(children, pipWindow.document.body)}
          {placeholder}
        </>
      );
    },
    [pipWindow],
  );

  useEffect(() => {
    try {
      const action = 'enterpictureinpicture' as MediaSessionAction;
      navigator.mediaSession.setActionHandler(action, open);
      return () => navigator.mediaSession.setActionHandler(action, null);
    } catch {}
  }, [open]);

  useEffect(() => {
    return () => pipWindowRef.current?.close();
  }, []);

  return {
    isSupported,
    pipWindow,
    open,
    close,
    createPipPortal,
  };
}

function copyStylesheetLinks(from: Document, to: Document) {
  from.head
    .querySelectorAll('link[rel="stylesheet"], style')
    .forEach((node) => {
      to.head.appendChild(node.cloneNode(true));
    });
}
