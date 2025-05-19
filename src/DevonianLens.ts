import { EventEmitter } from 'node:events';

export abstract class DevonianClient<Model> extends EventEmitter {
  abstract add(obj: Model): Promise<string>
}

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
};

export class DevonianLens<LeftModel, RightModel> {
  left: DevonianTable<LeftModel>;
  right: DevonianTable<RightModel>;
  constructor(left: DevonianTable<any>, right: DevonianTable<any>, leftToRight: (input: LeftModel) => RightModel, rightToLeft: (input: RightModel) => LeftModel) {
    this.left = left;
    this.right = right;
    left.on('add-from-client', (added: LeftModel) => {
      // console.log('lens forwards addition event from left to right');
      right.addFromLens(leftToRight(added));
    });
    right.on('add-from-client', (added: RightModel) => {
      // console.log('lens forwards addition event from right to left');
      left.addFromLens(rightToLeft(added));
    });
  }
}
