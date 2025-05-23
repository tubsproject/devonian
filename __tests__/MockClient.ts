import { EventEmitter } from 'node:events';
export class MockClient<ModelWithoutId, Model> extends EventEmitter {
  added: ModelWithoutId[] = [];
  name: string;
  idFieldName: string;
  constructor(name: string, idFieldName: string = 'id') {
    super();
    this.idFieldName = idFieldName;
    this.name = name;
  }
  async add(obj: ModelWithoutId): Promise<Model> {
    const position = this.added.length;
    // console.log(`Adding in ${this.name} mock client`, obj, position);
    this.added.push(obj);
    const ret = JSON.parse(JSON.stringify(obj));
    ret[this.idFieldName] = position;
    return ret;
  }
  fakeIncoming(obj: Model): void {
    // console.log('fake incoming in mock client', obj);
    this.emit('add-from-client', obj);
  }
}