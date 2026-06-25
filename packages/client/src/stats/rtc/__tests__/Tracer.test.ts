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

  it('exposes its id via .id', () => {
    expect(new Tracer('abc').id).toBe('abc');
    expect(new Tracer(null).id).toBeNull();
  });

  it('caps the buffer, dropping oldest and leaving an overflow marker', () => {
    const capped = new Tracer('id', 3);
    capped.trace('e', { n: 1 });
    capped.trace('e', { n: 2 });
    capped.trace('e', { n: 3 });
    capped.trace('e', { n: 4 }); // overflows the cap of 3

    const slice = capped.take();
    expect(slice.snapshot.length).toBe(3);
    expect(slice.snapshot[0][0]).toBe('traceBufferOverflow');
    // newest record is retained
    expect(slice.snapshot[slice.snapshot.length - 1][2]).toEqual({ n: 4 });
  });

  it('caps the buffer on rollback too', () => {
    const capped = new Tracer('id', 3);
    capped.trace('e', { n: 1 });
    const slice = capped.take();

    capped.trace('e', { n: 2 });
    capped.trace('e', { n: 3 });
    capped.trace('e', { n: 4 }); // buffer now at the cap of 3
    slice.rollback(); // prepends the old record, exceeding the cap

    const after = capped.take();
    expect(after.snapshot.length).toBe(3);
    expect(after.snapshot[0][0]).toBe('traceBufferOverflow');
  });
});
