import { EventEmitter } from 'node:events';
import { DevonianClient } from './DevonianClient.js';

export class DevonianTable<Model> extends EventEmitter {
  rows: Model[] = [];
  client: DevonianClient<Model>;
  constructor(client: DevonianClient<Model>) {
    super();
    this.client = client;
    client.on('add-from-client', (obj: Model) => {
      console.log('Adding to table', obj);
      this.rows.push(obj);
      this.emit('add-from-client', obj);
    });
  }
  async addFromLens(obj: Model): Promise<string> {
    const toStore = JSON.parse(JSON.stringify(obj));
    toStore.id = this.client.add(obj);
    this.rows.push(toStore);
    console.log('after store', this.rows);
    return toStore.id;
  }
  rowMatches(i: number, where: { [field: string]: string }) {
    for (let j = 0; j < Object.keys(where).length; j++) {
      const whereField = Object.keys(where)[j];
      if (this.rows[i][whereField] !== where[whereField]) {
        console.log(`Row ${i} mismatch on ${whereField}`);
        return false;
      }
    }
    return true;
  }
  async findWhere(field: string, where: { [field: string]: string }, addIfMissing: boolean = false): Promise<string | undefined> {
    console.log('findWhere', field, where, addIfMissing, this.rows);
    for (let i = 0; i < this.rows.length; i++) {
      if (this.rowMatches(i, where)) {
        console.log(`Row ${i} match`);
        return this.rows[i][field];
      }
    }
    if (addIfMissing) {
      const obj = JSON.parse(JSON.stringify(where));
      obj.id = undefined;
      console.log('addIfMissing!', obj);
      return this.addFromLens(obj);
    }
    return undefined;
  }
}
