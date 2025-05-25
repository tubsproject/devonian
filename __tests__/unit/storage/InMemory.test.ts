import { describe, it, expect } from 'vitest';
import { IndexedStorage } from '../../../src/storage/IndexedStorage.js';
import { InMemoryStorage } from '../../../src/storage/InMemory.js';
import { AcmeCustomerWithoutId } from '../../../examples/ExtractEntity.js';
import { ModelWithoutId } from '../../helpers.js';

describe('set, get, findObject', () => {
  it('can store rows', async () => {
    const storage = new IndexedStorage<ModelWithoutId>('storage-id', new InMemoryStorage<ModelWithoutId>());
    const foo = { foo: 'bar', foreignIds: {} };
    await storage.set(3, foo);
    expect(await storage.get(3)).toEqual(foo);
    expect(await storage.findObject(foo)).toEqual(3);
  });
});

describe('upsert', () => {
  it('can insert and find', async () => {
    const storage = new IndexedStorage<AcmeCustomerWithoutId>('storage-id', new InMemoryStorage<AcmeCustomerWithoutId>());
    const wile = {
      name: 'Wile E Coyote',
      address: '123 Desert Station',
      foreignIds: { }
    };
    const daffy = {
      name: 'Daffy Duck',
      address: 'White Rock Lake',
      foreignIds: { 'devonian-devonian-test-instance': 1 }
    };
    const positions = await Promise.all([
      storage.upsert(wile),
      storage.upsert(daffy),
       storage.upsert(wile),
    ]);
    expect(positions).toEqual([0, 1, 0]);
  });
});
