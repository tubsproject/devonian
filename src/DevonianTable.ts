import { EventEmitter } from 'node:events';
import { DevonianClient } from './DevonianClient.js';
import { IdentityMap } from './DevonianIndex.js';

export type DevonianModel = {
  id: number;
  foreignIds: IdentityMap;
};

export class DevonianTable<Model> extends EventEmitter {
  rows: DevonianModel[] = [];
  client: DevonianClient<Model>;
  platform: string;
  processId: string;
  constructor(client: DevonianClient<Model>, platform: string, replicaId: string) {
    super();
    this.client = client;
    this.platform = platform;
    this.processId = `devonian-${replicaId}`;
    client.on('add-from-client', (obj: DevonianModel) => {
      console.log('Adding to table', obj);
      const position = this.rows.length;
      obj.foreignIds[this.processId] = position.toString();
      this.rows.push(obj);
      this.emit('add-from-client', obj);
    });
  }
  async addFromLens(obj: DevonianModel): Promise<string> {
    const position = obj.foreignIds[this.processId];
    this.rows[position] = obj;
    const idOnPlatform = await this.client.add(obj as Model);
    this.rows[position].foreignIds[this.platform] = idOnPlatform;
    return idOnPlatform;
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
