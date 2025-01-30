export function AiCaptions(props: {
  captions: Array<{ key: string; text: string }>;
}) {
  return (
    <div className="ai-captions">
      {props.captions.slice(0, 6).map((caption) => (
        <div key={caption.key} className="ai-captions__caption">
          {caption.text}
        </div>
      ))}
    </div>
  );
}
