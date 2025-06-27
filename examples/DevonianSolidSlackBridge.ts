import { Effect, Schema } from 'effect';
import { DevonianClient } from '../src/DevonianClient.js';
import { DevonianTable } from '../src/DevonianTable.js';
import { DevonianLens } from '../src/DevonianLens.js';
import { DevonianIndex } from '../src/DevonianIndex.js';
import { SolidMessageWithoutId, SolidMessage, SolidMessageSchema } from './DevonianSolid.js';
import { SlackMessageWithoutId, SlackMessage, SlackMessageSchema } from './DevonianSlack.js';

export class DevonianSolidSlackBridge {
  index: DevonianIndex
  solidMessageTable: DevonianTable<SolidMessageWithoutId, SolidMessage>;
  slackMessageTable: DevonianTable<SlackMessageWithoutId, SlackMessage>;

  constructor(index: DevonianIndex, solidMessageClient: DevonianClient<SolidMessageWithoutId, SolidMessage>, slackMessageClient: DevonianClient<SlackMessageWithoutId, SlackMessage>) {
    this.index = index;
    this.solidMessageTable = new DevonianTable<SolidMessageWithoutId, SolidMessage>({ client: solidMessageClient, idFieldName: 'uri', platform: 'solid', replicaId: 'test-replica' });
    this.slackMessageTable = new DevonianTable<SlackMessageWithoutId, SlackMessage>({ client: slackMessageClient, idFieldName: 'ts', platform: 'slack', replicaId: 'test-replica' });
    const transformation = Schema.transformOrFail(
      SolidMessageSchema,
      SlackMessageSchema,
      {
        strict: true,
        decode: (input: SolidMessage): Effect.Effect<SlackMessage> => {
          return Effect.succeed({
            ts: (input.uri ? this.index.convertId('message', 'solid', input.uri, 'slack') as string : undefined),
            user: (input.authorWebId ? this.index.convertId('person', 'solid', input.authorWebId, 'slack') as string : undefined),
            text: input.text,
            channel: (input.chatUri ? this.index.convertId('channel', 'solid', input.chatUri, 'slack') as string : undefined),
            foreignIds: (input.uri ? this.index.convertForeignIds('solid', input.uri, input.foreignIds, 'slack') : {}),
          });
        },
        encode: (input: SlackMessage): Effect.Effect<SolidMessage> => {
          return Effect.succeed({
            uri: (input.ts ? this.index.convertId('message', 'slack', input.ts, 'solid') as string : undefined),
            chatUri: (input.channel ? this.index.convertId('channel', 'slack', input.channel, 'solid') as string : undefined),
            text: input.text,
            authorWebId: (input.user ? this.index.convertId('person', 'slack', input.user, 'solid') as string : undefined),
            date: (input.ts ? new Date(parseFloat(input.ts) * 1000) : undefined) as undefined,
            foreignIds: (input.ts ? this.index.convertForeignIds('slack', input.ts, input.foreignIds, 'solid') : {}),
          });
        },
      }
    );
    
    new DevonianLens<SolidMessageWithoutId, SlackMessageWithoutId, SolidMessage, SlackMessage>(
      this.solidMessageTable,
      this.slackMessageTable,
      async (input: SolidMessage): Promise<SlackMessage> => {
        return Effect.runPromise(Schema.decodeUnknown(transformation)(input));
      },
      async (input: SlackMessage): Promise<SolidMessage> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Effect.runPromise(Schema.encodeUnknown(transformation)(input) as any);
      },
    );
  }
}
