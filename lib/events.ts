// Lightweight typed event bus without Node's 'events' module
export type AppEvents = {
  'map:locationSelected': {
    address: string;
    latitude: number;
    longitude: number;
  };
};

class TypedEventBus {
  private listeners = new Map<keyof AppEvents, Set<Function>>();

  on<E extends keyof AppEvents>(event: E, listener: (payload: AppEvents[E]) => void): () => void {
    const set = this.listeners.get(event) ?? new Set<Function>();
    set.add(listener as Function);
    this.listeners.set(event, set);
    return () => {
      const s = this.listeners.get(event);
      if (s) s.delete(listener as Function);
    };
  }

  emit<E extends keyof AppEvents>(event: E, payload: AppEvents[E]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    [...set].forEach(l => {
      try {
        (l as (p: unknown) => void)(payload);
      } catch (e) {
        console.warn(`Event listener for ${String(event)} threw`, e);
      }
    });
  }
}

export const events = new TypedEventBus();
