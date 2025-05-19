import { DevonianClient } from '../src/DevonianClient.js';
import { ForeignIds } from '../src/DevonianIndex.js';



export type SolidMessage = {
  uri?: string,
  chatUri: string,
  text: string,
  authorWebId: string,
  date?: Date,
  foreignIds: ForeignIds,
};

export class SolidMessageClient extends DevonianClient<SolidMessage> {
  async add(obj: SolidMessage): Promise<string> {
    console.log('make an API call', obj);
    return 'uri';
  }
}