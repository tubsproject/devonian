import { DevonianClient } from '../src/DevonianClient.js';
import { IdentifierMap } from '../src/DevonianIndex.js';
import { DevonianModel } from '../src/DevonianTable.js';

export type SolidMessageWithoutId = DevonianModel & {
  chatUri: string,
  text: string,
  authorWebId: string,
  date?: Date,
  foreignIds: IdentifierMap,
};

export type SolidMessage = SolidMessageWithoutId & {
  uri?: string,
};

export class SolidMessageClient extends DevonianClient<SolidMessageWithoutId, SolidMessage> {
  async add(obj: SolidMessageWithoutId): Promise<SolidMessage> {
    console.log('make an API call', obj);
    return Object.assign(obj, { uri: 'uri' });
  }
}