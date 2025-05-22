import { EventEmitter } from 'node:events';
export class MockClient<ModelWithoutId, Model> extends EventEmitter {
  added: ModelWithoutId[] = [];
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }
  async add(obj: ModelWithoutId): Promise<Model> {
    const position = this.added.length;
    console.log(`Adding in ${this.name} mock client`, obj, position);
    this.added.push(obj);
    return Object.assign(obj, { id: position }) as Model;
  }
  fakeIncoming(obj: Model): void {
    // console.log('fake incoming in mock client', obj);
    this.emit('add-from-client', obj);
  }
}