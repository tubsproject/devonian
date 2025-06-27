import { EventEmitter } from 'node:events';
import { DevonianClient } from './DevonianClient.js';
import { DevonianModel } from './DevonianModel.js';
import { Storage } from './storage/interface.js';
import { IndexedStorage } from './storage/IndexedStorage.js';
import { InMemoryStorage } from './storage/InMemory.js';

export type DevonianTableOptions<ModelWithoutId, Model> = {
  client: DevonianClient<ModelWithoutId, Model>;
  idFieldName: string;
  platform: string;
  replicaId: string;
};

export class DevonianTable<
  ModelWithoutId extends DevonianModel,
  Model extends ModelWithoutId,
> extends EventEmitter {
  private storage: Storage<ModelWithoutId>;
  private client: DevonianClient<ModelWithoutId, Model>;
  private idFieldName: string;
  private platform: string;
  private minting: Promise<Model>[] = [];
  private replicaId: string;
  constructor(options: DevonianTableOptions<ModelWithoutId, Model>) {
    super();
    this.replicaId = options.replicaId;
    this.storage = new IndexedStorage<ModelWithoutId>(
      `devonian-${this.replicaId}`,
      new InMemoryStorage<ModelWithoutId>(),
    );
    this.client = options.client;
    this.idFieldName = options.idFieldName;
    this.platform = options.platform;
    this.client.on('add-from-client', async (obj: Model) => {
      // console.log('adding from client, upsert start');
      await this.ensureOnStorage(obj, ['foreignIds']);
      // console.log('adding from client, upsert finish');
      this.emit('add-from-client', obj);
    });
  }
  async ensureOnStorage(
    obj: ModelWithoutId,
    fieldsToMerge: string[],
  ): Promise<{ position: number; minted: boolean }> {
    const removeNativeForeignId = JSON.parse(JSON.stringify(obj));
    delete removeNativeForeignId.foreignIds[`devonian-${this.replicaId}`];
    if (typeof removeNativeForeignId[this.idFieldName] !== 'undefined') {
      removeNativeForeignId.foreignIds[this.platform] =
        removeNativeForeignId[this.idFieldName];
      delete removeNativeForeignId[this.idFieldName];
    }
    // console.log('ensureRow on storage', removeNativeForeignId);
    return this.storage.ensureRow(removeNativeForeignId, fieldsToMerge);
  }
  async ensureRow(obj: ModelWithoutId): Promise<number> {
    const { position, minted } = await this.ensureOnStorage(obj, [
      'foreignIds',
    ]); // FIXME: This is returning 2 instead of 0 for the second time Wile E Coyote
    // console.log({ position, minted }, obj.foreignIds, this.platform);
    if (minted && typeof obj.foreignIds[this.platform] === 'undefined') {
      // console.log('maybe minting', this.minting, position);
      if (typeof position === 'undefined') {
        throw new Error('undefined position');
      }
      obj.foreignIds[`devonian-${this.replicaId}`] = position;
      if (
        typeof this.minting[position] === 'undefined' &&
        typeof obj.foreignIds[this.platform] === 'undefined'
      ) {
        // console.log('really minting 1');
        this.minting[position] = this.client.add(
          JSON.parse(JSON.stringify(obj)) as ModelWithoutId,
        );
        // console.log('really minting 2');
        obj = await this.minting[position];
        // // console.log(`minting finished! Moving ${this.idFieldName} into foreignIds`, obj, typeof obj[this.idFieldName], (typeof obj[this.idFieldName] === 'undefined'));
        if (typeof obj[this.idFieldName] === 'undefined') {
          throw new Error(
            `client did not assign a value to the platform id field "${this.idFieldName}"`,
          );
        }
        await this.ensureOnStorage(obj, ['foreignIds']);
        await new Promise((resolve) => setTimeout(resolve, 0));
        // console.log('DELETING THE MINTING SEMAPHORE!', await this.getRows());
        delete this.minting[position];
      } else {
        // console.log('joining the queue');
        obj = await this.minting[position];
      }
      // console.log('done');
    }
    // console.log('return');
    return position;
  }
  async getRows(): Promise<ModelWithoutId[]> {
    return this.storage.getRows();
  }
  async getRow(position: number): Promise<ModelWithoutId | undefined> {
    return this.storage.get(position);
  }

  async getPlatformId(
    where: ModelWithoutId,
    addIfMissing: boolean = false,
  ): Promise<string | number | undefined> {
    // console.log('getPlatformId', where, addIfMissing);
    const position = await (addIfMissing
      ? this.ensureRow(where)
      : this.storage.findObject(where));
    // console.log('back in getPlatformId', position, typeof this.minting[position], await this.storage.get(position));
    if (typeof position === 'undefined') {
      return undefined;
    }
    if (typeof this.minting[position] !== 'undefined') {
      // console.log('oh, that position is minting!');
      return this.minting[position].then(() => {
        // console.log('oh, that position is done minting!', obj, this.platform);
        return position;
      });
    }
    const obj = await this.storage.get(position);
    if (!obj) {
      return;
    }
    obj.foreignIds[this.platform] = position;
    return obj.foreignIds[this.platform];
  }
}
