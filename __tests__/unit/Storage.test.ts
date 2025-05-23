import { describe, it, expect } from 'vitest';
import { DevonianModel } from '../../src/DevonianModel.js';
import { InMemory } from '../../src/Storage.js';
import { AcmeCustomerWithoutId } from '../../examples/ExtractEntity.js';

type ModelWithoutId = DevonianModel & {
  foo: string;
};

//   findObject(obj: ModelWithoutId): Promise<number | undefined>;
//   get(position: number): Promise<ModelWithoutId>;
//   set(position: number, obj: ModelWithoutId): Promise<void>;
//   upsert(obj: ModelWithoutId): Promise<number>;
//   getRows(): Promise<ModelWithoutId[]>;

describe('set, get, findObject', () => {
  it('can store rows', async () => {
    const storage = new InMemory<ModelWithoutId>('storage-id');
    const foo = { foo: 'bar', foreignIds: {} };
    await storage.set(3, foo);
    expect(await storage.get(3)).toEqual(foo);
    expect(await storage.findObject(foo)).toEqual(3);
  });
});

describe('upsert', () => {
  it('can insert and find', async () => {
    const storage = new InMemory<AcmeCustomerWithoutId>('storage-id');
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
