import { describe, expect, it } from 'vitest';
import { KrispNoiseCancellation } from '../KrispNoiseCancellation';
import { FastEnhancerNoiseCancellation } from '../FastEnhancerNoiseCancellation';

describe('KrispNoiseCancellation model', () => {
  it('reports the default model', () => {
    expect(new KrispNoiseCancellation().model).toBe('krisp-nc-o-med-v7');
  });

  it('reports the model from the call settings model path', () => {
    const nc = new KrispNoiseCancellation();
    nc.configure({
      modelPath: 'https://cdn.example.com/models/krisp-nc-o-hi-v8.kef?sig=1',
    });
    expect(nc.model).toBe('krisp-nc-o-hi-v8');
  });

  it('reports the model from the Krisp SDK params', () => {
    const nc = new KrispNoiseCancellation({
      krispSDKParams: {
        models: { modelNC: { url: '/models/krisp-nc-s-v1.kef' } },
      },
    });
    expect(nc.model).toBe('krisp-nc-s-v1');
  });
});

describe('FastEnhancerNoiseCancellation model', () => {
  it('reports the model size', () => {
    expect(new FastEnhancerNoiseCancellation().model).toBe('tiny');
    expect(new FastEnhancerNoiseCancellation({ model: 'base' }).model).toBe(
      'base',
    );
  });
});
