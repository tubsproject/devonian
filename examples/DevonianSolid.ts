import { DevonianClient } from '../src/DevonianClient.js';
import { IdentifierMap } from '../src/IdentifierMap.js';
import { DevonianModel } from '../src/DevonianModel.js';

export type SolidMessageWithoutId = DevonianModel & {
  chatUri: string,
  text: string,
  authorWebId: string,
  date?: Date,
  foreignIds: IdentifierMap,
};

export type SolidMessage = SolidMessageWithoutId & {
  uri: string,
};

export class SolidMessageClient extends DevonianClient<SolidMessageWithoutId, SolidMessage> {
  async add(obj: SolidMessageWithoutId): Promise<SolidMessage> {
    const ret = Object.assign({ uri: 'uri' }, obj);
    // console.log('make an API call to post this message to Solid', obj, ret);
    return ret;
  }
}