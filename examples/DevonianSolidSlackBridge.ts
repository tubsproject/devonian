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
    this.slackMessageTable = new DevonianTable<SlackMessageWithoutId, SlackMessage>({ client: slackMessageClient, idFieldName: 'ts', platform: 'slack', replicaId: 'test-replica' });
    new DevonianLens<SolidMessageWithoutId, SlackMessageWithoutId, SolidMessage, SlackMessage>(
      this.solidMessageTable,
      this.slackMessageTable,
      async (input: SolidMessage): Promise<SlackMessage> => {
        const ret = {
          ts: (input.uri ? this.index.convertId('message', 'solid', input.uri, 'slack') as string : undefined),
          user: (input.authorWebId ? this.index.convertId('person', 'solid', input.authorWebId, 'slack') as string : undefined),
          text: input.text,
          channel: this.index.convertId('channel', 'solid', input.chatUri, 'slack') as string,
          foreignIds: (input.uri ? this.index.convertForeignIds('solid', input.uri, input.foreignIds, 'slack') : {}),
        };
        // console.log('converting from Solid to Slack', input, ret);
        return ret;
      },
      async (input: SlackMessage): Promise<SolidMessage> => {
        const ret = {
          uri: (input.ts ? this.index.convertId('message', 'slack', input.ts, 'solid') as string : undefined),
          chatUri: this.index.convertId('channel', 'slack', input.channel, 'solid') as string,
          text: input.text,
          authorWebId: (input.user ? this.index.convertId('person', 'slack', input.user, 'solid') as string : undefined),
          date: (input.ts ? new Date(parseFloat(input.ts) * 1000) : undefined),
          foreignIds: (input.ts ? this.index.convertForeignIds('slack', input.ts, input.foreignIds, 'solid') : {}),
        };
        // console.log('converting from Slack to Solid', input, ret);
        return ret;
      },
    );
  }
}
