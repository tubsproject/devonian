import { EventEmitter } from 'node:events';

export abstract class DevonianClient<ModelWithoutId, Model> extends EventEmitter {
  abstract add(obj: ModelWithoutId): Promise<Model>;
}
