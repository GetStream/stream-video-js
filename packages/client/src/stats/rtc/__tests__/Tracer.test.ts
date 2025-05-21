import { beforeEach, describe, expect, it } from 'vitest';
import { Tracer } from '../Tracer';

describe('Tracer', () => {
  let tracer: Tracer;

  beforeEach(() => {
    tracer = new Tracer('test-id');
  });

  it('should record trace events when enabled', () => {
    tracer.trace('test-tag', { value: 123 });
    const slice = tracer.take();
    expect(slice.snapshot.length).toBe(1);
    const [tag, id, data] = slice.snapshot[0];
    expect(tag).toBe('test-tag');
    expect(id).toBe('test-id');
    expect(data).toEqual({ value: 123 });
  });

  it('should not record trace events when disabled', () => {
    tracer.setEnabled(false);
    tracer.trace('test-tag', { value: 123 });
    const slice = tracer.take();
    expect(slice.snapshot.length).toBe(0);
  });

  it('should clear buffer when taking a slice', () => {
    tracer.trace('test-tag', { value: 123 });
    const slice = tracer.take();
    expect(slice.snapshot.length).toBe(1);

    // Buffer should be cleared after taking
    const emptySlice = tracer.take();
    expect(emptySlice.snapshot.length).toBe(0);
  });

  it('should restore buffer when rolling back a slice', () => {
    tracer.trace('test-tag', { value: 123 });
    const slice = tracer.take();
    expect(slice.snapshot.length).toBe(1);

    tracer.trace('test-tag-2', { value: 456 });

    // Rollback should restore the buffer
    slice.rollback();
    const restoredSlice = tracer.take();
    expect(restoredSlice.snapshot.length).toBe(2);
  });

  it('should clear buffer when disposed', () => {
    tracer.trace('test-tag', { value: 123 });
    tracer.dispose();
    const slice = tracer.take();
    expect(slice.snapshot.length).toBe(0);
  });
});
