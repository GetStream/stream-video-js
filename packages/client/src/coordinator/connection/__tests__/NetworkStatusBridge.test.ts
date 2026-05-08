import { describe, expect, it, vi } from 'vitest';
import { NetworkStatusBridge } from '../internal/NetworkStatusBridge';
import { createTestNetworkRegistry } from './helpers/networkRegistry';

describe('NetworkStatusBridge', () => {
  it('attach() registers the internal handler', () => {
    const registry = createTestNetworkRegistry();
    const onOnline = vi.fn();
    const onOffline = vi.fn();
    const bridge = new NetworkStatusBridge({
      register: registry.register,
      unregister: registry.unregister,
      onOnline,
      onOffline,
    });
    expect(registry.hasHandler()).toBe(false);
    bridge.attach();
    expect(registry.hasHandler()).toBe(true);
  });

  it('attach() is idempotent', () => {
    const registry = createTestNetworkRegistry();
    const register = vi.fn(registry.register);
    const bridge = new NetworkStatusBridge({
      register,
      unregister: registry.unregister,
      onOnline: vi.fn(),
      onOffline: vi.fn(),
    });
    bridge.attach();
    bridge.attach();
    expect(register).toHaveBeenCalledTimes(1);
  });

  it('detach() unregisters the same handler reference', () => {
    const registry = createTestNetworkRegistry();
    const bridge = new NetworkStatusBridge({
      register: registry.register,
      unregister: registry.unregister,
      onOnline: vi.fn(),
      onOffline: vi.fn(),
    });
    bridge.attach();
    bridge.detach();
    expect(registry.hasHandler()).toBe(false);
  });

  it('detach() before attach() is a no-op', () => {
    const registry = createTestNetworkRegistry();
    const unregister = vi.fn(registry.unregister);
    const bridge = new NetworkStatusBridge({
      register: registry.register,
      unregister,
      onOnline: vi.fn(),
      onOffline: vi.fn(),
    });
    bridge.detach();
    expect(unregister).not.toHaveBeenCalled();
  });

  it('online events route to onOnline', () => {
    const registry = createTestNetworkRegistry();
    const onOnline = vi.fn();
    const onOffline = vi.fn();
    const bridge = new NetworkStatusBridge({
      register: registry.register,
      unregister: registry.unregister,
      onOnline,
      onOffline,
    });
    bridge.attach();
    registry.fireOnline();
    expect(onOnline).toHaveBeenCalledTimes(1);
    expect(onOffline).not.toHaveBeenCalled();
  });

  it('offline events route to onOffline', () => {
    const registry = createTestNetworkRegistry();
    const onOnline = vi.fn();
    const onOffline = vi.fn();
    const bridge = new NetworkStatusBridge({
      register: registry.register,
      unregister: registry.unregister,
      onOnline,
      onOffline,
    });
    bridge.attach();
    registry.fireOffline();
    expect(onOffline).toHaveBeenCalledTimes(1);
    expect(onOnline).not.toHaveBeenCalled();
  });
});
