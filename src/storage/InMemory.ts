import { DevonianModel } from '../DevonianModel.js';
import { CoreStorage } from './IndexedStorage.js';

export class InMemoryStorage<ModelWithoutId extends DevonianModel>
  implements CoreStorage<ModelWithoutId>
{
  private rows: ModelWithoutId[] = [];
  async getRow(i: number): Promise<ModelWithoutId | undefined> {
    return JSON.parse(JSON.stringify(this.rows[i])); // copy on read
  }
  async setRow(i: number, row: ModelWithoutId): Promise<void> {
    console.log('storing', i, row);
    this.rows[i] = row;
  }
  async getRows(): Promise<ModelWithoutId[]> {
    return this.rows;
  }
}
