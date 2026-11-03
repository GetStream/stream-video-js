import { describe, expect, it } from 'vitest';
import { isHeadsetLabel } from '../headsetLabel';

describe('isHeadsetLabel', () => {
  it.each([
    'Default - WH-1000XM5',
    'WH-CH720N',
    'WF-1000XM5',
    'Sony LinkBuds S',
    'AirPods Pro',
    'Jona’s AirPods Max',
    'AirPods de Marie',
    'Default - AirPods (3rd generation)',
    'Beats Studio Pro',
    'Powerbeats Pro',
    'Bose QuietComfort Ultra Headphones',
    'Bose QC35 II',
    'Bose NC Headphones 700',
    'Jabra Evolve2 65',
    'Jabra Elite 85h',
    'Poly Voyager 4320',
    'Plantronics Blackwire 5220',
    'Sennheiser MOMENTUM 4',
    'Galaxy Buds2 Pro',
    'Pixel Buds Pro',
    'Nothing Ear (2)',
    'Soundcore Liberty 4 NC',
    'Huawei FreeBuds 5i',
    'JLab Go Air Pop',
    'JBL Tune 510BT',
    'Generic TWS earbuds',
    'USB Headset',
    'Bluetooth Headphones',
    'Hands-Free AG Audio',
  ])('matches headset "%s"', (label) => {
    expect(isHeadsetLabel(label)).toBe(true);
  });

  it.each([
    'Default - MacBook Pro Speakers',
    'MacBook Pro Microphone',
    'Studio Display Speakers',
    'LG HDR 4K',
    'Built-in Output',
    'ZoomAudioDevice',
    'BlackHole 2ch',
    'Bose SoundLink Flex',
    'JBL Flip 6',
    'JBL Boombox 3',
    'Jabra Speak 510',
    'Logitech Z407',
    'Sony SRS-XB13',
    'Soundcore Motion+',
    'Poly Studio P5',
    'HomePod',
    'Sonos Beam',
  ])('does not match "%s"', (label) => {
    expect(isHeadsetLabel(label)).toBe(false);
  });

  it('handles a missing or empty label', () => {
    expect(isHeadsetLabel(undefined)).toBe(false);
    expect(isHeadsetLabel('')).toBe(false);
  });
});
