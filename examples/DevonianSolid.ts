import { Schema } from 'effect';
import { DevonianClient } from '../src/DevonianClient.js';
import { IdentifierMapSchema } from '../src/IdentifierMap.js';
import { DevonianModelSchema } from '../src/DevonianModel.js';

export const SolidMessageSchemaWithoutId = Schema.Struct({
  ... DevonianModelSchema.fields,
  chatUri: Schema.Union(Schema.String, Schema.Undefined),
  text: Schema.String,
  authorWebId: Schema.Union(Schema.String, Schema.Undefined),
  date: Schema.Union(Schema.Date, Schema.Undefined),
  foreignIds: IdentifierMapSchema,
});
export type SolidMessageWithoutId = typeof SolidMessageSchemaWithoutId.Type;

export const SolidMessageSchema = Schema.Struct({
  ... SolidMessageSchemaWithoutId.fields,
  uri: Schema.Union(Schema.String, Schema.Undefined),
});
export type SolidMessage = typeof SolidMessageSchema.Type;

export class SolidMessageClient extends DevonianClient<SolidMessageWithoutId, SolidMessage> {
  async add(obj: SolidMessageWithoutId): Promise<SolidMessage> {
    const ret = Object.assign({ uri: 'uri' }, obj);
    // console.log('make an API call to post this message to Solid', obj, ret);
    return ret;
  }
}