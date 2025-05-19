import { DevonianClient } from '../src/DevonianClient.js';
import { ForeignIds } from '../src/DevonianIndex.js';

export type SlackMessage = {
  ts?: string,
  user?: string,
  channel: string,
  text: string,
  foreignIds: ForeignIds,
};

export class SlackMessageClient extends DevonianClient<SlackMessage> {
  async add(obj: SlackMessage): Promise<string> {
    console.log('make an API call to post this message to Slack', obj);
    return 'ts';
  }
}
    
