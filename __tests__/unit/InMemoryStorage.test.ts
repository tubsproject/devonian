import { describe, it, expect } from 'vitest';
import { InMemory, DevonianModel } from '../../src/DevonianTable.js';
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
    const position1 = await storage.upsert(wile);
    expect(position1).toEqual(0);
    const position2 = await storage.upsert(daffy);
    expect(position2).toEqual(1);
    wile.foreignIds = { 'devonian-devonian-test-instance': 0 };
    const position3 = await storage.upsert(wile);
    expect(position3).toEqual(0);
  });
});
