import { Schema } from "effect"
import { IdentifierMapSchema } from './IdentifierMap.js';

export const DevonianModelSchema = Schema.Struct({
  foreignIds: IdentifierMapSchema,
});

export type DevonianModel = Schema.Schema<typeof DevonianModelSchema>