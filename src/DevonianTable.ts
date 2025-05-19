import { EventEmitter } from 'node:events';
import { DevonianClient } from './DevonianClient.js';

export class DevonianTable<Model> extends EventEmitter {
  rows: Model[] = [];
  constructor(client: DevonianClient<Model>) {
    super();
    this.on('add-from-lens', (obj: Model) => {
      client.add(obj);
    });
    client.on('incoming', (obj: Model) => {
      this.addFromClient(obj);
    });
  }
  async addFromLens(obj: Model): Promise<void> {
    this.rows.push(obj);
    this.emit('add-from-lens', obj);
  }
  async addFromClient(obj: Model): Promise<void> {
    this.rows.push(obj);
    this.emit('add-from-client', obj);
  }
}
