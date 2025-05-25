import { DocHandle } from '@automerge/automerge-repo';
import { DevonianModel } from '../DevonianModel.js';
import { CoreStorage } from './IndexedStorage.js';

export class AutomergeStorage<ModelWithoutId extends DevonianModel>  implements CoreStorage<ModelWithoutId> {
  private docHandle: DocHandle<ModelWithoutId[]>;
  private busy: Promise<void>[] = [];
  constructor(docHandle: DocHandle<ModelWithoutId[]>) {
    this.docHandle = docHandle;
  }

  async getRow(i: number): Promise<ModelWithoutId | undefined> {
    if (typeof this.busy[i] !== 'undefined') {
      // console.log('getRow awaits busy!', i);
      await this.busy[i];
      // console.log('getRow done awaiting busy!', i);
    }
    // console.log('getRow start');
    const rows = await this.getRows();
    // console.log('getRow returning', rows[i]);
    return rows[i];
  }
  async setRow(i: number, row: ModelWithoutId): Promise<void> {
    if (typeof this.busy[i] !== 'undefined') {
      // console.log('setRow awaits busy!', i);
      await this.busy[i];
      // console.log('setRow done awaiting busy!', i);
    }
    // console.log('before change', i, row);
    // console.log('doc before', await this.docHandle.doc()[i]);
    this.busy[i] = new Promise((resolve) => {
      this.docHandle.change(d => {
        // console.log('change start', i, row);
        d[i] = row;
        // console.log('change done', i, row);
        resolve();
        delete this.busy[i]; // FIXME: what if the resolve makes this row busy again?
      });
    });
    // console.log('after change', i, row);
    // console.log('doc after', await this.docHandle.doc()[i]);
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
