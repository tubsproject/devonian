import { EventEmitter } from 'node:events';
import { DevonianClient } from './DevonianClient.js';

export class DevonianTable<Model> extends EventEmitter {
  rows: Model[] = [];
  client: DevonianClient<Model>
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
}