import { Call, StreamCallClosedCaption } from '@stream-io/video-client';

export class ClosedCaptionManager {
  status: 'on' | 'off' = 'off';
  private unsubscribe?: () => void;
  private captionContainer?: HTMLElement;

  constructor(private call: Call) {
    this.call.updateClosedCaptionSettings({
      queueSize: 5,
    });
  }

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

  async showCaptions() {
    this.status = 'on';
    await this.call.startClosedCaptions();
    this.unsubscribe = this.call.state.closedCaptions$.subscribe((captions) => {
      this.updateDisplayedCaptions(captions);
    }).unsubscribe;
  }

  async hideCaptions() {
    this.status = 'off';
    await this.call.stopClosedCaptions();
    this.cleanup();
  }

  cleanup() {
    this.unsubscribe?.();
  }

  private updateDisplayedCaptions(captions: StreamCallClosedCaption[]) {
    if (!this.captionContainer) {
      console.warn(
        'Render caption container before turning on closed captions',
      );
      return;
    }

    this.captionContainer.innerHTML = captions
      .map((caption) => `<b>${caption.speaker_name}:</b> ${caption.text}`)
      .join('<br>');
  }
}
