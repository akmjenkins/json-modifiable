import { JSONPatchOperation } from './patch';
import { Rule, JSONModifiable, Options } from './index';

export { JSONPatchOperation } from './patch';

type JSONOptions = Omit<Options, 'resolver' | 'patch'>;

export type JSONPatchRule = Rule<JSONPatchOperation[]>;

export function jsonEngine<Descriptor, Context>(
  descriptor: Descriptor,
  rules: JSONPatchRule[],
  options: JSONOptions<Descriptor, JSONPatchOperation, Context>,
): JSONModifiable<Descriptor, JSONPatchOperation, Context>;
