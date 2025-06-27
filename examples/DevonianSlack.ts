import { DevonianClient } from '../src/DevonianClient.js';
import { IdentifierMap } from '../src/IdentifierMap.js';
import { DevonianModel } from '../src/DevonianModel.js';

export type SlackMessageWithoutId = DevonianModel & {
  user: string | undefined,
  channel: string,
  text: string,
  foreignIds: IdentifierMap,
};

export type SlackMessage = SlackMessageWithoutId & {
  ts: string | undefined,
};

export class SlackMessageClient extends DevonianClient<SlackMessageWithoutId, SlackMessage> {
  async add(obj: SlackMessageWithoutId): Promise<SlackMessage> {
    const ret = Object.assign({ ts: 'ts' }, obj);
    // console.log('make an API call to post this message to Slack', obj);
    return ret;
  }
}
    
