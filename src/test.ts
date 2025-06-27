import { Effect, Schema } from 'effect';
import { SolidMessageSchema, SolidMessage } from '../examples/DevonianSolid.js';
import { SlackMessageSchema, SlackMessage } from '../examples/DevonianSlack.js';

// Convert "on"/"off" to boolean and back
const SolidSlackLens = Schema.transformOrFail(
  SolidMessageSchema,
  SlackMessageSchema,
  {
    strict: true,
    decode: (input: SolidMessage): Effect.Effect<SlackMessage> => {
      return Effect.succeed({
        ts: '1',
        user: '2',
        text: `Solid said "${input.text}"`,
        channel: '4',
        foreignIds: {},
      });
    },
    encode: (input: SlackMessage): Effect.Effect<SolidMessage> => {
      return Effect.succeed({
        uri: '1',
        chatUri: '2',
        text: `Slack said "${input.text}"`,
        authorWebId: '3',
        date: undefined,
        foreignIds: {},
      });
    },
  },
);

console.log(
  await Effect.runPromise(
    Schema.decodeUnknown(SolidSlackLens)({
      uri: '1',
      chatUri: '2',
      text: 'convert me',
      authorWebId: '3',
      date: undefined,
      foreignIds: {},
    }),
  ),
);
