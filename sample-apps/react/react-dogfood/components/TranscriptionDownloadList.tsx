import { CallTranscription, Icon } from '@stream-io/video-react-sdk';
import { useAppI18n } from '../hooks/useAppI18n';

/**
 * The CDN serves files cross-origin without `Content-Disposition`, so the
 * anchor's `download` attribute is ignored and the browser would just display
 * the file. Saving it through a same-origin blob URL forces a download.
 */
const downloadFile = async (url: string, filename: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blobUrl = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(blobUrl);
};

export const TranscriptionDownloadList = ({
  transcriptions,
}: {
  transcriptions: CallTranscription[];
}) => {
  const { t } = useAppI18n();
  return (
    <div className="rd__transcription-download-list">
      {transcriptions.map(({ filename, url }) => (
        <div className="str-video__call-recording-list__item" key={filename}>
          <div className="str-video__call-recording-list__filename rd__transcription-download-list__filename">
            {filename}
          </div>
          <div className="str-video__call-recording-list__download">
            <a
              className="str-video__call-recording-list-item__action-button str-video__call-recording-list-item__action-button--download"
              role="button"
              href={url}
              download={filename}
              onClick={(e) => {
                e.preventDefault();
                downloadFile(url, filename).catch((err) => {
                  console.warn('Failed to download transcript', err);
                  window.open(url, '_blank');
                });
              }}
              title={t(
                'recordings.transcriptions.download.title',
                'Download the transcript',
              )}
            >
              <Icon icon="download" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};
