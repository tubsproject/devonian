
import { DevonianModel } from './DevonianModel.js';
import { IdentifierMap } from './IdentifierMap.js';

export interface Storage<ModelWithoutId extends DevonianModel> {
  findObject(obj: ModelWithoutId): Promise<number | undefined>;
  get(position: number): Promise<ModelWithoutId>;
  set(position: number, obj: ModelWithoutId): Promise<void>;
  upsert(obj: ModelWithoutId): Promise<number>;
  getRows(): Promise<ModelWithoutId[]>;
}

export class InMemory<ModelWithoutId extends DevonianModel> implements Storage<ModelWithoutId> {
  private rows: ModelWithoutId[] = [];
  private storageId: string;
  private semaphore: Promise<void>;
  constructor(storageId: string) {
    this.storageId = storageId;
  }
  private rowMatches(i: number, where: object): boolean {
    console.log('here we go - rowMatches', i, where, this.rows[i]);
    if (typeof this.rows[i] === 'undefined') {
      console.log('returning false for undefined row!');
      return false;
    }
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
    if (typeof this.rows[i] === 'undefined') {
      return false;
    }
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
    // console.log('findById non-native', platform, id, this.rows);
    // FIXME: this is inefficient if the array is very sparse 
    // I could use for .. in but that makes i a string instead of a number
    // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections#sparse_arrays
    // and https://stackoverflow.com/a/54847594/680454
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
  async doUpsert(obj: ModelWithoutId): Promise<number> {
    let position = await this.findObject(obj);
    console.log('this is where upsert decides', position, this.rows);
    if (typeof position === 'undefined') {
      position = this.rows.length;
    }
    this.rows[position] = obj;
    return position;
  }
  async upsert(obj: ModelWithoutId): Promise<number> {
    if (typeof this.semaphore !== 'undefined') {
      await this.semaphore;
    }
    const promise = this.doUpsert(obj);
    this.semaphore = promise.then((): void => {
        delete this.semaphore;
    });
    return promise;
  }
  async getRows(): Promise<ModelWithoutId[]> {
    return this.rows;
  }

}
