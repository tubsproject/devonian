import { describe, it, expect } from 'vitest';
import { IndexedStorage } from '../../../src/storage/IndexedStorage.js';
import { InMemoryStorage } from '../../../src/storage/InMemory.js';
import { ModelWithoutId } from '../../helpers.js';

describe('upsert', () => {
  it('can deal with concurrency', async () => {
    const storage = new IndexedStorage<ModelWithoutId>('storage-id', new InMemoryStorage<ModelWithoutId>());
    const foo = { foo: 'bar', foreignIds: {} };
    await Promise.all([
      storage.upsert(foo),
      storage.upsert(foo),
      storage.upsert(foo),
    ]);
    expect(await storage.getRows()).toEqual([ foo ]);
  });
});
