import { EventEmitter } from 'node:events';
import { DevonianClient } from './DevonianClient.js';
import { IdentifierMap } from './DevonianIndex.js';

export type DevonianModel = {
  foreignIds: IdentifierMap;
};

interface Storage<ModelWithoutId extends DevonianModel> {
  findObject(obj: ModelWithoutId): Promise<number | undefined>;
  get(position: number): Promise<ModelWithoutId>;
  set(position: number, obj: ModelWithoutId): Promise<void>;
  upsert(obj: ModelWithoutId): Promise<number>;
  getRows(): Promise<ModelWithoutId[]>;
}

class InMemory<ModelWithoutId extends DevonianModel> implements Storage<ModelWithoutId> {
  private rows: ModelWithoutId[] = [];
  private storageId: string;
  constructor(storageId: string) {
    this.storageId = storageId;
  }
  private rowMatches(i: number, where: object): boolean {
    for (let j = 0; j < Object.keys(where).length; j++) {
      const whereField = Object.keys(where)[j];
      if (this.rows[i][whereField] !== where[whereField]) {
        console.log(`Row ${i} mismatch on ${whereField}`);
        return false;
      }
    }
    return true;
  }
  private rowMatchesId(i: number, platform: string, id: string | number): boolean {
    return (this.rows[i].foreignIds[platform] === id);
  }
  private findWhere(where: object): number | undefined {
    console.log('findWhere', where, this.rows);
    for (let i = 0; i < this.rows.length; i++) {
      if (this.rowMatches(i, where)) {
        console.log(`Row ${i} match`);
        return i;
      }
    }
    return undefined;
  }
  private findById(platform: string, id: string | number): number | undefined {
    if (platform === this.storageId) {
      console.log(`Identity ${platform}:${id} is native`);
      return (typeof id === 'string' ? parseInt(id) : id);
    }
    console.log('findById non-native', platform, id, this.rows);
    for (let i = 0; i < this.rows.length; i++) {
      if (this.rowMatchesId(i, platform, id)) {
        console.log(`Row ${i} non-native match`);
        return i;
      }
    }
    console.log('findById fail', platform, id, this.rows);
    return undefined;
  }
  async findByIdMap(idMap: IdentifierMap): Promise<number | undefined> {
    const platforms = Object.keys(idMap);
    for (let i = 0; i < platforms.length; i++) {
      console.log(`Trying platform ${i}`);
      const thisResult = this.findById(platforms[i], idMap[platforms[i]]);
      console.log(`back from findById; result`, thisResult, typeof thisResult);
      if (typeof thisResult === 'string' || typeof thisResult === 'number') {
        console.log(`Row ${thisResult} match, returning from findByIdMap`);
        return thisResult;
      }
    }
    console.log(`findByIdMap fail`);
    return undefined;
  }
  async get(position: number): Promise<ModelWithoutId> {
    return this.rows[position];
  }
  async set(position: number, obj: ModelWithoutId): Promise<void> {
    this.rows[position] = obj;
  }
  async findObject(obj: ModelWithoutId): Promise<number | undefined> {
    console.log('findObject calls findByIdMap');
    let position = await this.findByIdMap(obj.foreignIds);
    console.log('back in findObject', position, typeof position);
    if (typeof position === 'undefined') {
      console.log('findObject calls findWhere', position);
      position = this.findWhere(obj);
    }
    return position;
  }
  async upsert(obj: ModelWithoutId): Promise<number> {
    let position = await this.findObject(obj);
    if (typeof position === 'undefined') {
      position = this.rows.length;
    }
    this.rows[position] = obj;
    return position;
  }
  async getRows(): Promise<ModelWithoutId[]> {
    return this.rows;
  }

}

export type DevonianTableOptions<ModelWithoutId, Model> = {
  client: DevonianClient<ModelWithoutId, Model>;
  idFieldName: string;
  platform: string;
  replicaId: string;
}

export class DevonianTable<ModelWithoutId extends DevonianModel, Model extends ModelWithoutId> extends EventEmitter {
  private storage: Storage<ModelWithoutId>;
  private client: DevonianClient<ModelWithoutId, Model>;
  private idFieldName: string;
  private platform: string;
  private minting: Promise<Model>[] = [];
  private replicaId: string;
  constructor(options: DevonianTableOptions<ModelWithoutId, Model>) {
    super();
    this.replicaId = options.replicaId;
    this.storage = new InMemory(`devonian-${this.replicaId}`);
    this.client = options.client;
    this.idFieldName = options.idFieldName;
    this.platform = options.platform;
    this.client.on('add-from-client', async (obj: Model) => {
      console.log('adding from client, upsert start');
      await this.storage.upsert(obj);
      console.log('adding from client, upsert finish');
      this.emit('add-from-client', obj);
    });
  }
  async addFromLens(obj: ModelWithoutId): Promise<number> {
    console.log('upserting', obj);
    const position = await this.storage.upsert(obj); FIXME: THis is returning 2 instead of 0 for the second time Wile E Coyote
    console.log({ position }, obj.foreignIds, this.platform);
    if (typeof obj.foreignIds[this.platform] === 'undefined') {
      console.log('maybe minting', this.minting, position);
      obj.foreignIds[`devonian-${this.replicaId}`] = position;
      if (typeof this.minting[position] === 'undefined') {
        console.log('really minting');
        this.minting[position] = this.client.add(obj as ModelWithoutId);
      } else {
        console.log('joining the queue');
      }
      obj = await this.minting[position];
      console.log('minting finished! updating', obj);
      obj.foreignIds[this.platform] = obj[this.idFieldName];
      delete obj[this.idFieldName];
      await this.storage.upsert(obj as ModelWithoutId);
      delete this.minting[position];
      console.log('done');
    }
    console.log('return');
    return position;
  }
  async getRows(): Promise<ModelWithoutId[]> {
    return this.storage.getRows();
  }

  async getPlatformId(where: ModelWithoutId, addIfMissing: boolean = false): Promise<string | number | undefined > {
    console.log('getPlatformId', where, addIfMissing);
    const position = await (addIfMissing ? this.addFromLens(where) : this.storage.findObject(where));
    console.log('back in getPlatformId', position);
    if (typeof position === 'undefined') {
      return undefined;
    }
    if (typeof this.minting[position] !== 'undefined') {
      console.log('oh, that position is minting!');
      return this.minting[position].then((obj: ModelWithoutId) => {
      console.log('oh, that position is done minting!', obj, this.platform);
        return obj.foreignIds[this.platform];
      });
    }
    console.log('calling storage get', position);
    const obj = await this.storage.get(position);
    console.log('getting platform id from object', obj, this.platform);
    // if (typeof obj.foreignIds[this.platform] === 'undefined') {
    //     console.log('really minting');
    //     this.minting[position] = this.client.add(obj as ModelWithoutId);
    // }
    return obj.foreignIds[this.platform];
  }
}
