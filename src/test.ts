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


async function wait(): Promise<number> {
  return new Promise(resolve => setTimeout(() => {
    resolve(42);
  }, 10));
}


function promiseToEffect(promise: Promise<number>): Effect.Effect<number> {
  return Effect.gen(function* () {
    const result = yield* Effect.promise(() => promise);
    return result;
  });
}

const promise = wait();
console.log(await Effect.runPromise(promiseToEffect(promise)));
