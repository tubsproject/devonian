import { DocHandle } from '@automerge/automerge-repo';
import { DevonianModel } from '../DevonianModel.js';
import { CoreStorage } from './IndexedStorage.js';

export class AutomergeStorage<ModelWithoutId extends DevonianModel>  implements CoreStorage<ModelWithoutId> {
  private docHandle: DocHandle<ModelWithoutId[]>;
  constructor(docHandle: DocHandle<ModelWithoutId[]>) {
    this.docHandle = docHandle;
  }

  async getRow(i: number): Promise<ModelWithoutId | undefined> {
    console.log('getRow start');
    const rows = await this.getRows();
    console.log('getRow returning', rows[i]);
    await new Promise(resolve => setTimeout(resolve, 100));
    return rows[i];
  }
  async setRow(i: number, row: ModelWithoutId): Promise<void> {
    console.log('before change', i, row);
    console.log('doc before', await this.docHandle.doc()[i]);
    await this.docHandle.change(d => {
      console.log('change start', i, row);
      d[i] = row;
      console.log('change done', i, row);
    });
    console.log('after change', i, row);
    console.log('doc after', await this.docHandle.doc()[i]);
  }
  async getRows(): Promise<ModelWithoutId[]> {
    const stringMap = await this.docHandle.doc();
    const ret:  ModelWithoutId[] = [];
    Object.keys(stringMap).forEach((key: string) => {
      ret[parseInt(key)] = stringMap[key];
    });
    return ret;
  }
}
