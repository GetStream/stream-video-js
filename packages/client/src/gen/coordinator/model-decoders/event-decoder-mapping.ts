import { decoders } from '../model-decoders/decoders';

/**
 * Decodes a WS event payload in place (datetime string fields -> Date) via the
 * walker decoder, and returns it.
 *
 * The walker decodes purely by field name, so every event type resolves to the
 * same generic walk. The single exception is `call.dtmf` (`CallDTMFEvent`),
 * whose type is in the walker's TS_DT set and therefore needs its exact type
 * name to decode correctly. Every other event — known or unknown — is walked
 * generically; walking an unknown event is a no-op beyond renaming any known
 * datetime fields it happens to carry.
 */
export const decodeWSEvent = (data: { type: string } & Record<string, any>) =>
  data.type === 'call.dtmf'
    ? decoders.CallDTMFEvent(data)
    : decoders.WSEvent(data);
