import { Schema } from 'effect';
import { SolidMessageSchema, SolidMessage } from '../examples/DevonianSolid.js';
import { SlackMessageSchema, SlackMessage } from '../examples/DevonianSlack.js';

// Convert "on"/"off" to boolean and back
const SolidSlackLens = Schema.transform(
  SolidMessageSchema,
  SlackMessageSchema,
  {
    strict: true,
    decode: (input: SolidMessage): SlackMessage => {
      return {
        ts: '1',
        user: '2',
        text: `Solid said "${input.text}"`,
        channel: '4',
        foreignIds: {},
      };
    },
    encode: (input: SlackMessage): SolidMessage => {
      return {
        uri: '1',
        chatUri: '2',
        text: `Slack said "${input.text}"`,
        authorWebId: '3',
        date: undefined,
        foreignIds: {},
      };
    },
  }
)

console.log(Schema.decodeUnknownSync(SolidSlackLens)({
  uri: '1',
  chatUri: '2',
  text: 'convert me',
  authorWebId: '3',
  date: undefined,
  foreignIds: {},
}));