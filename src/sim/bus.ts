import type { Command, SimEvent } from './types';
export class CommandBus {
  private queue: Command[] = [];
  enqueue(command: Command): void { this.queue.push(structuredClone(command)); }
  drain(): Command[] { return this.queue.splice(0); }
  clear(): void { this.queue.length = 0; }
}
export class EventBus {
  private listeners = new Set<(event: SimEvent) => void>();
  on(listener: (event: SimEvent) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }
  emit(event: SimEvent): void { for (const listener of this.listeners) listener(event); }
}
