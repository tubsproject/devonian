import { DevonianModel } from '../DevonianModel.js';
import { IdentifierMap } from '../IdentifierMap.js';
import { Storage } from './interface.js';

export interface CoreStorage<ModelWithoutId extends DevonianModel> {
  getRow(i: number): Promise<ModelWithoutId | undefined>;
  setRow(i: number, row: ModelWithoutId): Promise<void>;
  getRows(): Promise<ModelWithoutId[]>;
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
  private rowMatches(where: object, row: ModelWithoutId): boolean {
    // console.log('here we go - rowMatches', where, row);
    if (typeof row === 'undefined') {
      // console.log('returning false for undefined row!');
      return false;
    }
    for (let j = 0; j < Object.keys(where).length; j++) {
      const whereField = Object.keys(where)[j];
      if (row[whereField] !== where[whereField]) {
        // console.log(`Row mismatch on ${whereField}`);
        return false;
      }
    }
    return true;
  }
  private rowMatchesId(
    platform: string,
    id: string | number,
    row: ModelWithoutId,
  ): boolean {
    if (typeof row === 'undefined') {
      return false;
    }
    return row.foreignIds[platform] === id;
  }
  private async findWhere(where: object): Promise<number | undefined> {
    const rows = await this.coreStorage.getRows();
    // console.log('findWhere', where, rows);
    // console.log('searching rows', rows);
    for (let i = 0; i < rows.length; i++) {
      if (this.rowMatches(where, rows[i])) {
        // console.log(`Row ${i} match`);
        return i;
      }
    }
    return undefined;
  }
  private async findById(
    platform: string,
    id: string | number,
  ): Promise<number | undefined> {
    if (platform === this.storageId) {
      // console.log(`Identity ${platform}:${id} is native`);
      return typeof id === 'string' ? parseInt(id) : id;
    }
    // console.log('findById non-native', platform, id, this.rows);
    // FIXME: this is inefficient if the array is very sparse
    // I could use for .. in but that makes i a string instead of a number
    // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections#sparse_arrays
    // and https://stackoverflow.com/a/54847594/680454
    const rows = await this.coreStorage.getRows();
    for (let i = 0; i < rows.length; i++) {
      if (this.rowMatchesId(platform, id, rows[i])) {
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
      const thisResult = await this.findById(platforms[i], idMap[platforms[i]]);
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
      // console.log('findObject calls findWhere', where);
      position = await this.findWhere(where);
      // console.log('findWhere returned', position);
    }
    // console.log('findObject returns', position);
    return position;
  }
  async doUpsert(
    obj: ModelWithoutId,
    fieldsToMerge: string[],
  ): Promise<{ position: number; minted: boolean }> {
    let position = await this.findObject(obj);
    let minted = false;
    const rows = await this.coreStorage.getRows();
    // console.log('this is where upsert decides', position, rows, fieldsToMerge, obj);
    if (typeof position === 'undefined') {
      position = rows.length;
      minted = true;
    }
    if (typeof position === 'number' && typeof rows[position] !== 'undefined') {
      fieldsToMerge.forEach((field: string) => {
        Object.keys(rows[position][field]).forEach((platform: string) => {
          obj[field][platform] = rows[position][field][platform];
        });
      });
    }
    if (JSON.stringify(rows[position]) !== JSON.stringify(obj)) {
      // console.log('UPDATING ROW', position, rows[position], obj);
    }
    // console.log('doUpsert awaits setRow start', position, obj);
    await this.coreStorage.setRow(position, obj);
    // console.log('doUpsert awaits setRow end', position, minted, obj);
    return { position, minted };
  }
  async ensureRow(
    obj: ModelWithoutId,
    fieldsToMerge: string[],
  ): Promise<{ position: number; minted: boolean }> {
    // console.log('UPSERT', obj);
    if (typeof this.semaphore !== 'undefined') {
      // console.log('awaiting semaphore');
      await this.semaphore;
    }
    const promise = this.doUpsert(obj, fieldsToMerge);
    this.semaphore = promise.then((): void => {
      delete this.semaphore;
    });
    return promise;
  }
  getRows(): Promise<ModelWithoutId[]> {
    return this.coreStorage.getRows();
  }
}
//
