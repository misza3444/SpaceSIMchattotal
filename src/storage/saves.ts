import { z } from 'zod';
import { readWorld, worldSchema } from '../sim/state';
import type { WorldState } from '../sim/types';
export const CURRENT_SAVE_VERSION = 1;
const envelopeV0 = z.object({ version: z.literal(0), state: worldSchema }).strict();
const envelopeV1 = z.object({ version: z.literal(1), savedAt: z.string(), state: worldSchema });
export function migrateSave(input: unknown): { version: 1; savedAt: string; state: WorldState } {
  const record = z.object({ version: z.number() }).passthrough().parse(input);
  if (record.version === 1) {
    const value = envelopeV1.parse(input);
    return { ...value, state: readWorld(value.state) };
  }
  if (record.version === 0) {
    const value = envelopeV0.parse(input);
    return { version: 1, savedAt: 'legacy', state: readWorld(value.state) };
  }
  throw new Error('Unsupported save version');
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('spacesim-web', 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('saves')) request.result.createObjectStore('saves', { keyPath: 'slotId' });
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
export async function saveWorld(state: WorldState, slotId = 'quick'): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('saves', 'readwrite');
      transaction.objectStore('saves').put({ slotId, version: 1, savedAt: new Date().toISOString(), state: readWorld(state) });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('Save aborted'));
    });
  } finally { db.close(); }
}
export async function loadWorld(slotId = 'quick'): Promise<WorldState | null> {
  const db = await database();
  try {
    const raw = await new Promise<unknown>((resolve, reject) => {
      const transaction = db.transaction('saves', 'readonly');
      const request = transaction.objectStore('saves').get(slotId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('Read aborted'));
    });
    return raw === undefined ? null : migrateSave(raw).state;
  } finally { db.close(); }
}
