const audioCache = new Map<string, () => Promise<void>>();

/**
 * Plays an audio file from the provided url
 */
export async function beep(url: string) {
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
      await audio.play();
    };

    audioCache.set(url, play);
  }

  await play();
}
