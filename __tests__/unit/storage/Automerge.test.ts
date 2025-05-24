import { describe, it, expect } from 'vitest';
import { ModelWithoutId } from '../../helpers.js';
import { Automerge } from '../../../src/Storage.js';
import { AcmeCustomerWithoutId } from '../../../examples/ExtractEntity.js';
import { Repo } from '@automerge/automerge-repo';
import { BroadcastChannelNetworkAdapter } from '@automerge/automerge-repo-network-broadcastchannel';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';

// docHandle.on('change', ({ patchInfo }) => {
//   console.log(`change on docHandle1, patchInfo:`, patchInfo);
// });
// console.log('docHandle1 created');
// type ModelWithoutId = DevonianModel & {
//   foo: string;
// };

//   findObject(obj: ModelWithoutId): Promise<number | undefined>;
//   get(position: number): Promise<ModelWithoutId>;
//   set(position: number, obj: ModelWithoutId): Promise<void>;
//   upsert(obj: ModelWithoutId): Promise<number>;
//   getRows(): Promise<ModelWithoutId[]>;

describe('set, get, findObject', () => {
  const repo = new Repo({
    network: [new BroadcastChannelNetworkAdapter()],
    storage: new NodeFSStorageAdapter('./data'),
  });
  const docHandle = repo.create();
  const storage = new Automerge<ModelWithoutId>('storage-id', docHandle);

  it('can store rows', async () => {
    const foo = { foo: 'bar', foreignIds: {} };
    await storage.set(3, foo);
    expect(await storage.get(3)).toEqual(foo);
    expect(await storage.findObject(foo)).toEqual(3);
  });
});

describe('upsert', () => {
  it('can insert and find', async () => {
    const repo = new Repo({
      network: [new BroadcastChannelNetworkAdapter()],
      storage: new NodeFSStorageAdapter('./data'),
    });
    const docHandle = repo.create();
    const storage = new Automerge<AcmeCustomerWithoutId>('storage-id', docHandle);
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
