import { DevonianClient } from '../src/DevonianClient.js';
import { IdentifierMap } from '../src/DevonianIndex.js';
import { DevonianModel } from '../src/DevonianTable.js';

export type SlackMessageWithoutId = DevonianModel & {
  ts?: string,
  user?: string,
  channel: string,
  text: string,
  foreignIds: IdentifierMap,
};

export type SlackMessage = SlackMessageWithoutId & {
  ts?: string,
};

export class SlackMessageClient extends DevonianClient<SlackMessageWithoutId, SlackMessage> {
  async add(obj: SlackMessageWithoutId): Promise<SlackMessage> {
    console.log('make an API call to post this message to Slack', obj);
    return Object.assign(obj, { ts: 'ts' });
  }
}
    
