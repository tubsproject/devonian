import { EventEmitter } from 'node:events';

export abstract class DevonianClient<Model> extends EventEmitter {
  abstract add(obj: Model): Promise<string>;
}
