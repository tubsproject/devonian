import { EventEmitter } from 'node:events';
import { DevonianClient } from './DevonianClient.js';

export class DevonianTable<Model> extends EventEmitter {
  rows: Model[] = [];
  client: DevonianClient<Model>;
  constructor(client: DevonianClient<Model>) {
    super();
    this.client = client;
    client.on('add-from-client', (obj: Model) => {
      this.rows.push(obj);
      this.emit('add-from-client', obj);
    });
  }
  addFromLens(obj: Model): void {
    this.rows.push(obj);
    this.client.add(obj);
  }
  findWhere(field: string, where: { [field: string]: string }) {
    for (let i = 0; i < this.rows.length; i++) {
      for (let j = 0; j < Object.keys(where).length; j++) {
        const whereField = Object.keys(where)[j];
        if (this.rows[i][whereField] !== where[whereField]) {
          console.log(`Row ${i} mismatch on ${whereField}`);
          continue;
        }
      }
      console.log(`Row ${i} match`);
      return this.rows[i][field];
    }
    return undefined;
  }
}
