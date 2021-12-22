import { JSONPatchOperation } from './patch';
import { Validator, Rule, JSONModifiable, Options } from './engine';

export { JSONPatchOperation } from './patch';

type JSONOptions = Omit<Options, 'resolver' | 'patch'>;

export type JSONPatchRule<Schema = unknown> = Rule<
  JSONPatchOperation[],
  Schema
>;

export function jsonEngine<Descriptor, Schema = unknown, Context = unknown>(
  descriptor: Descriptor,
  validator: Validator<Schema>,
  rules: JSONPatchRule[],
  options?: JSONOptions<Descriptor, JSONPatchOperation, Context>,
): JSONModifiable<Descriptor, Schema, JSONPatchOperation, Context>;
