import {
  Call,
  CallClosedCaption,
  ClosedCaptionEvent,
} from '@stream-io/video-client';

export class ClosedCaptionManager {
  status: 'on' | 'off' = 'off';
  private unsubscribe?: () => void;
  private captionRefreshInterval?: ReturnType<typeof setInterval>;
  private captions: (CallClosedCaption & { speaker_name?: string })[] = [];
  private captionContainer?: HTMLElement;

  constructor(private call: Call) {}

  renderToggleElement() {
    const button = document.createElement('button');
    button.textContent =
      this.status === 'on'
        ? 'Turn off closed captions'
        : 'Turn on closed captions';

    button.addEventListener('click', async () => {
      this.status === 'on' ? this.hideCaptions() : this.showCaptions();
      button.textContent =
        this.status === 'on'
          ? 'Turn off closed captions'
          : 'Turn on closed captions';
    });

    return button;
  }

  renderCaptionContainer() {
    this.captionContainer = document.createElement('div');

    return this.captionContainer;
  }

  showCaptions() {
    this.status = 'on';
    this.unsubscribe = this.call.on(
      'call.closed_caption',
      (event: ClosedCaptionEvent) => {
        const caption = event.closed_caption;
        const isDuplicate = this.captions.find(
          (c) =>
            c.speaker_id === caption.speaker_id &&
            c.start_time === caption.start_time,
        );
        if (!isDuplicate) {
          const speaker = this.call.state.participants.find(
            (p) => p.userId === caption.speaker_id,
          );
          const speakerName = speaker?.name || speaker?.userId;
          this.captions.push({ ...caption, speaker_name: speakerName });
          this.updateDisplayedCaptions();
        }
      },
    );
    this.captionRefreshInterval = setInterval(() => {
      this.captions = this.captions.slice(1);
      this.updateDisplayedCaptions();
    }, 2700);
  }

  hideCaptions() {
    this.status = 'off';
    this.cleanup();
  }

  cleanup() {
    this.unsubscribe?.();
    clearInterval(this.captionRefreshInterval);
  }

  private updateDisplayedCaptions() {
    if (!this.captionContainer) {
      console.warn(
        'Render caption container before turning on closed captions',
      );
      return;
    }
    const displayedCaptions = this.captions.slice(-2);
    this.captionContainer.innerHTML = displayedCaptions
      .map((c) => `<b>${c.speaker_name}:</b> ${c.text}`)
      .join('\n');
  }
}
