// Matches an audio device label that looks like a headset (earbuds, headphones,
// headset). Browsers expose no transport type, so this is a name heuristic:
// brand + model line for the common Bluetooth headsets, plus generic words.
// Speakers and speakerphones from the same brands (Bose SoundLink, JBL Flip,
// Jabra Speak) are deliberately not matched.
const HEADSET_LABEL =
  /\bairpods|\bbeats\b|\bpowerbeats|\bw[hf]-\w|\blinkbuds|\binzone\b|quietcomfort|\bbose\b.*(?:\bqc\d*|\bnc\b|headphones|earbuds|\b700\b)|\bjabra\b(?!.*\bspeak)|\bevolve2?\b|\bvoyager\b|\bblackwire\b|\bsavi\b|momentum|\bgalaxy buds|\bpixel buds|\bnothing ear|\bliberty\b|\bsoundcore (?:life|space|liberty)|buds\b|\bjlab\b|\btws\b|\bjbl (?:tune|live|endurance|reflect|quantum)\b|earbuds|earphones?|headsets?|headphones?|hands-?free/i;

/**
 * Whether the given audio device label looks like a headset.
 */
export const isHeadsetLabel = (label: string | undefined): boolean =>
  !!label && HEADSET_LABEL.test(label);
