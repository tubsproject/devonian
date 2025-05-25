import { DevonianModel } from '../DevonianModel.js';
import { IdentifierMap } from '../IdentifierMap.js';
import { Storage } from './interface.js';
export class CoreStorage<ModelWithoutId extends DevonianModel> {
  private rows: ModelWithoutId[] = [];
  getRow(i: number):  ModelWithoutId | undefined {
    return this.rows[i];
  }
  setRow(i: number, row: ModelWithoutId): void {
    this.rows[i] = row;
  }
  getRows(): ModelWithoutId[] {
    return this.rows;
  }
  getRowsLength(): number {
    return this.rows.length;
  }
}
export class IndexedStorage<ModelWithoutId extends DevonianModel>
  implements Storage<ModelWithoutId>
{
  private storageId: string;
  private semaphore: Promise<void>;
  private coreStorage: CoreStorage<ModelWithoutId>;
  constructor(storageId: string, coreStorage: CoreStorage<ModelWithoutId>) {
    this.storageId = storageId;
    this.coreStorage = coreStorage;
  }
  private rowMatches(i: number, where: object): boolean {
    // console.log('here we go - rowMatches', i, where, this.coreStorage.getRow(i));
    if (typeof this.coreStorage.getRow(i) === 'undefined') {
      // console.log('returning false for undefined row!');
      return false;
    }
    for (let j = 0; j < Object.keys(where).length; j++) {
      const whereField = Object.keys(where)[j];
      if (this.coreStorage.getRow(i)[whereField] !== where[whereField]) {
        // console.log(`Row ${i} mismatch on ${whereField}`);
        return false;
      }
    }
    return true;
  }
  private rowMatchesId(
    i: number,
    platform: string,
    id: string | number,
  ): boolean {
    if (typeof this.coreStorage.getRow(i) === 'undefined') {
      return false;
    }
    return this.coreStorage.getRow(i).foreignIds[platform] === id;
  }
  private findWhere(where: object): number | undefined {
    // console.log('findWhere', where, this.rows);
    for (let i = 0; i < this.coreStorage.getRowsLength(); i++) {
      if (this.rowMatches(i, where)) {
        // console.log(`Row ${i} match`);
        return i;
      }
    }
    return undefined;
  }
  private findById(platform: string, id: string | number): number | undefined {
    if (platform === this.storageId) {
      // console.log(`Identity ${platform}:${id} is native`);
      return typeof id === 'string' ? parseInt(id) : id;
    }
    // console.log('findById non-native', platform, id, this.rows);
    // FIXME: this is inefficient if the array is very sparse
    // I could use for .. in but that makes i a string instead of a number
    // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections#sparse_arrays
    // and https://stackoverflow.com/a/54847594/680454
    for (let i = 0; i < this.coreStorage.getRowsLength(); i++) {
      if (this.rowMatchesId(i, platform, id)) {
        // console.log(`Row ${i} non-native match`);
        return i;
      }
    }
    // console.log('findById fail', platform, id, this.rows);
    return undefined;
  }
  async findByIdMap(idMap: IdentifierMap): Promise<number | undefined> {
    const platforms = Object.keys(idMap);
    for (let i = 0; i < platforms.length; i++) {
      // console.log(`Trying platform ${i}`);
      const thisResult = this.findById(platforms[i], idMap[platforms[i]]);
      // console.log(`back from findById; result`, thisResult, typeof thisResult);
      if (typeof thisResult === 'string' || typeof thisResult === 'number') {
        // console.log(`Row ${thisResult} match, returning from findByIdMap`);
        return thisResult;
      }
    }
    // console.log(`findByIdMap fail`);
    return undefined;
  }
  async get(position: number): Promise<ModelWithoutId> {
    return this.coreStorage.getRow(position);
  }
  async set(position: number, obj: ModelWithoutId): Promise<void> {
    this.coreStorage.setRow(position, obj);
  }
  async findObject(obj: ModelWithoutId): Promise<number | undefined> {
    // console.log('findObject calls findByIdMap');
    let position = await this.findByIdMap(obj.foreignIds);
    // console.log('back in findObject', position, typeof position);
    if (typeof position === 'undefined') {
      const where = JSON.parse(JSON.stringify(obj));
      delete where.foreignIds;
      // console.log('findObject calls findWhere', position);
      position = this.findWhere(where);
    }
    return position;
  }
  async doUpsert(obj: ModelWithoutId): Promise<number> {
    let position = await this.findObject(obj);
    // console.log('this is where upsert decides', position, this.rows);
    if (typeof position === 'undefined') {
      position = this.coreStorage.getRowsLength();
    }
    if (JSON.stringify(this.coreStorage.getRow(position)) !== JSON.stringify(obj)) {
      // console.log('UPDATING ROW', position, this.coreStorage.getRow(position), obj);
    }
    this.coreStorage.setRow(position, obj);
    return position;
  }
  async upsert(obj: ModelWithoutId): Promise<number> {
    // console.log('UPSERT', obj);
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
    return this.coreStorage.getRows();
  }
}
