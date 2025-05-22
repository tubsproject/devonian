import { DevonianClient } from '../src/DevonianClient.js';
import { IdentityMap } from '../src/DevonianIndex.js';



export type SolidMessage = {
  uri?: string,
  chatUri: string,
  text: string,
  authorWebId: string,
  date?: Date,
  foreignIds: IdentityMap,
};

export class SolidMessageClient extends DevonianClient<SolidMessage> {
  async add(obj: SolidMessage): Promise<string> {
    console.log('make an API call', obj);
    return 'uri';
  }
}