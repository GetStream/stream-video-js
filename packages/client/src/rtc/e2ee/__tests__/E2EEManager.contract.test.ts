import { describe, expect, it, vi } from 'vitest';
import { type E2EEManager } from '../E2EEManager';

describe('E2EEManager contract', () => {
  it('accepts a minimal custom implementation (encrypt + decrypt only)', () => {
    const sender = { transform: null } as unknown as RTCRtpSender;
    const receiver = { transform: null } as unknown as RTCRtpReceiver;

    // A custom manager that is NOT an EncryptionManager - e.g. a third-party
    // RFC 9605 SFrame implementation. The interface is the only contract the
    // RTC layer relies on, so this object must be a valid E2EEManager.
    const custom: E2EEManager = {
      encrypt: vi.fn(),
      decrypt: vi.fn(),
    };

    custom.encrypt(sender, 'vp8');
    custom.decrypt(receiver, 'remote-user');

    expect(custom.encrypt).toHaveBeenCalledWith(sender, 'vp8');
    expect(custom.decrypt).toHaveBeenCalledWith(receiver, 'remote-user');
  });
});
