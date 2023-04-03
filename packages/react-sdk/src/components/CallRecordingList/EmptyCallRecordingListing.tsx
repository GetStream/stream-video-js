export const EmptyCallRecordingListing = () => {
  return (
    <div className="str-video__call-recording-list__listing str-video__call-recording-list__listing--empty">
      <div className="str-video__call-recording-list__listing--icon-empty" />
      <p className="str-video__call-recording-list__listing--text-empty">
        {/* todo: introduce i18n to enable text customization */}
        No recordings available
      </p>
    </div>
  );
};
