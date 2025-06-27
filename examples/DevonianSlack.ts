import { Schema } from 'effect';
import { DevonianClient } from '../src/DevonianClient.js';
import { IdentifierMapSchema } from '../src/IdentifierMap.js';
import { DevonianModelSchema } from '../src/DevonianModel.js';

export const SlackMessageSchemaWithoutId = Schema.Struct({
  ... DevonianModelSchema.fields,
  user: Schema.Union(Schema.String, Schema.Undefined),
  channel: Schema.Union(Schema.String, Schema.Undefined),
  text: Schema.String,
  foreignIds: IdentifierMapSchema,
});
export type SlackMessageWithoutId = typeof SlackMessageSchemaWithoutId.Type;

export const SlackMessageSchema = Schema.Struct({
  ... SlackMessageSchemaWithoutId.fields,
  ts: Schema.Union(Schema.String, Schema.Undefined),
});
export type SlackMessage = typeof SlackMessageSchema.Type;

export class SlackMessageClient extends DevonianClient<SlackMessageWithoutId, SlackMessage> {
  async add(obj: SlackMessageWithoutId): Promise<SlackMessage> {
    const ret = Object.assign({ ts: 'ts' }, obj);
    // console.log('make an API call to post this message to Slack', obj);
    return ret;
  }
}
    
