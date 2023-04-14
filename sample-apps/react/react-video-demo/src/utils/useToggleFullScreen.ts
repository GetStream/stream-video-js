export const toggleFullScreen = () => {
  const doc = window.document;
  const docEl = doc.documentElement;

  if (!doc.fullscreenElement) {
    docEl.requestFullscreen.call(docEl);
  } else {
    doc.exitFullscreen.call(doc);
  }
};
