// A compact pool; the key only has to be hard to guess and easy to read aloud.
// prettier-ignore
const WORDS = [
  'amber', 'anchor', 'aspen', 'atlas', 'autumn', 'badger', 'basil', 'beacon',
  'birch', 'bison', 'blossom', 'breeze', 'brook', 'canyon', 'cedar', 'cider',
  'cobalt', 'comet', 'coral', 'cosmic', 'crimson', 'crystal', 'dawn', 'delta',
  'dune', 'ember', 'falcon', 'fern', 'fjord', 'forest', 'frost', 'galaxy',
  'garnet', 'glacier', 'harbor', 'hazel', 'heron', 'horizon', 'indigo', 'island',
  'jasper', 'juniper', 'kestrel', 'lagoon', 'lantern', 'lemon', 'lotus', 'lunar',
  'maple', 'meadow', 'mesa', 'misty', 'nebula', 'nimble', 'oasis', 'olive',
  'onyx', 'orchid', 'otter', 'pebble', 'pepper', 'pine', 'plume', 'prairie',
  'quartz', 'quiet', 'raven', 'reef', 'river', 'rover', 'saffron', 'sage',
  'shadow', 'sierra', 'silver', 'sparrow', 'spruce', 'summit', 'sunny', 'tango',
  'thistle', 'thunder', 'tidal', 'topaz', 'tundra', 'velvet', 'violet', 'walnut',
  'willow', 'winter', 'yonder', 'zephyr',
];

/**
 * `count` distinct random words joined by `-` (e.g. `amber-otter-canyon`), the
 * same shape as the react-dogfood app's generated E2EE keys.
 */
export function getRandomWords(count = 3): string {
  const picked: string[] = [];
  while (picked.length < count && picked.length < WORDS.length) {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    if (!picked.includes(word)) picked.push(word);
  }
  return picked.join('-');
}
