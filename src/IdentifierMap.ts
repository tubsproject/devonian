import { Schema } from 'effect';

export const IdentifierMapSchema = Schema.mutable(
  Schema.Record({
    key: Schema.String,
    value: Schema.Union(Schema.NonEmptyString, Schema.Number),
  }),
);

export type IdentifierMap = Schema.Schema.Type<typeof IdentifierMapSchema>;
