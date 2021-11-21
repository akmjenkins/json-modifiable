import { JSONPatchOperation } from './patch';
import { Validator, Rule, JSONModifiable, Options } from './engine';

export { JSONPatchOperation } from './patch';

type JSONOptions = Omit<Options, 'resolver' | 'patch'>;

export type JSONPatchRule = Rule<JSONPatchOperation[]>;

export function jsonEngine<Descriptor, Context>(
  descriptor: Descriptor,
  validator: Validator,
  rules: JSONPatchRule[],
  options?: JSONOptions<Descriptor, JSONPatchOperation, Context>,
): JSONModifiable<Descriptor, JSONPatchOperation, Context>;
