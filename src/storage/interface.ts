import { DevonianModel } from '../DevonianModel.js';

export interface Storage<ModelWithoutId extends DevonianModel> {
  findObject(obj: ModelWithoutId): Promise<number | undefined>;
  get(position: number): Promise<ModelWithoutId>;
  set(position: number, obj: ModelWithoutId): Promise<void>;
  upsert(obj: ModelWithoutId): Promise<number>;
  getRows(): Promise<ModelWithoutId[]>;
}
