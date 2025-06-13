const audioCache = new Map<string, () => Promise<() => void>>();

/**
 * Plays an audio file from the provided url
 */
export async function beep(
  url: string,
  options: { loop?: boolean } = {},
): Promise<() => void> {
  let play = audioCache.get(url);

  if (!play) {
    const canPlayPromise = new Promise<HTMLAudioElement>((resolve) => {
      const audio = new Audio(url);
      audio.addEventListener('canplaythrough', () => resolve(audio), {
        once: true,
      });
    });

    play = async () => {
      const audio = await canPlayPromise;
      audio.loop = options.loop ?? false;
      await audio.play();
      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    };

    audioCache.set(url, play);
  }

  return await play();
}
