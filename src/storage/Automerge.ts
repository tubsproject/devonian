import { DocHandle } from '@automerge/automerge-repo';
import { DevonianModel } from '../DevonianModel.js';
import { CoreStorage } from './IndexedStorage.js';

export class AutomergeStorage<ModelWithoutId extends DevonianModel>  implements CoreStorage<ModelWithoutId> {
  private docHandle: DocHandle<ModelWithoutId[]>;
  constructor(docHandle: DocHandle<ModelWithoutId[]>) {
    this.docHandle = docHandle;
  }

  getRow(i: number): ModelWithoutId | undefined {
    return this.docHandle.docSync()[i];
  }
  async setRow(i: number, row: ModelWithoutId): Promise<void> {
    await this.docHandle.change(d => {
      d[i] = row;
    });
  }
  getRows(): readonly ModelWithoutId[] {
    return this.docHandle.docSync();
  }
  getRowsLength(): number {
    return this.getRows().length;
  }
}
