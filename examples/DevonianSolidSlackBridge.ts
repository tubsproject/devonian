import { DevonianClient } from '../src/DevonianClient.js';
import { DevonianTable } from '../src/DevonianTable.js';
import { DevonianLens } from '../src/DevonianLens.js';
import { DevonianIndex } from '../src/DevonianIndex.js';
import { SolidMessageWithoutId, SolidMessage } from './DevonianSolid.js';
import { SlackMessageWithoutId, SlackMessage } from './DevonianSlack.js';

export class DevonianSolidSlackBridge {
  index: DevonianIndex
  solidMessageTable: DevonianTable<SolidMessageWithoutId, SolidMessage>;
  slackMessageTable: DevonianTable<SlackMessageWithoutId, SlackMessage>;

  constructor(index: DevonianIndex, solidMessageClient: DevonianClient<SolidMessageWithoutId, SolidMessage>, slackMessageClient: DevonianClient<SlackMessageWithoutId, SlackMessage>) {
    this.index = index;
    this.solidMessageTable = new DevonianTable<SolidMessageWithoutId, SolidMessage>({ client: solidMessageClient, idFieldName: 'uri', platform: 'solid', replicaId: 'test-replica' });
    this.slackMessageTable = new DevonianTable<SlackMessageWithoutId, SlackMessage>({ client: slackMessageClient, idFieldName: 'uri', platform: 'slack', replicaId: 'test-replica' });
    new DevonianLens<SolidMessageWithoutId, SlackMessageWithoutId, SolidMessage, SlackMessage>(
      this.solidMessageTable,
      this.slackMessageTable,
      async (input: SolidMessage): Promise<SlackMessage> => {
        const ret = {
          ts: this.index.convert('message', 'solid', input.uri, 'slack') as string,
          user: this.index.convert('person', 'solid', input.authorWebId, 'slack') as string,
          text: input.text,
          channel: this.index.convert('channel', 'solid', input.chatUri, 'slack') as string,
          foreignIds: this.index.convertForeignIds('solid', input.uri, input.foreignIds, 'slack'),
        };
        // console.log('converting from Solid to Slack', input, ret);
        return ret;
      },
      async (input: SlackMessage): Promise<SolidMessage> => {
        const ret = {
          uri: this.index.convert('message', 'slack', input.ts, 'solid') as string,
          chatUri: this.index.convert('channel', 'slack', input.channel, 'solid') as string,
          text: input.text,
          authorWebId: this.index.convert('person', 'slack', input.user, 'solid') as string,
          date: new Date(parseFloat(input.ts) * 1000),
          foreignIds: this.index.convertForeignIds('slack', input.ts, input.foreignIds, 'solid'),
        };
        // console.log('converting from Slack to Solid', input, ret);
        return ret;
      },
    );
  }
}
