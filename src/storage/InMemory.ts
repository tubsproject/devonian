import { DevonianModel } from '../DevonianModel.js';
import { CoreStorage } from './IndexedStorage.js';

export class InMemoryStorage<ModelWithoutId extends DevonianModel> implements CoreStorage<ModelWithoutId> {
  private rows: ModelWithoutId[] = [];
  getRow(i: number):  ModelWithoutId | undefined {
    return this.rows[i];
  }
  async setRow(i: number, row: ModelWithoutId): Promise<void> {
    this.rows[i] = row;
  }
  getRows(): ModelWithoutId[] {
    return this.rows;
  }
  getRowsLength(): number {
    return this.rows.length;
  }
}
