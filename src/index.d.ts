import { JSONPatchOperation } from './patch';

type Unsubscribe = () => void;
type Subscriber<T> = (arg: T) => void;

type Validator = (schema: any, subject: any) => boolean;
type Resolver = (object: Record<string, unknown>, path: string) => any;

type ErrorEvent = {
  type: 'ValidationError' | 'PatchError';
  err: Error;
};

interface JSONModifiable<T, C, Op> {
  get: () => T;
  set: (descriptor: T) => void;
  setRules: (rules: Rule<Op>[]) => void;
  setContext: (context: C) => void;
  subscribe: (subscriber: Subscriber<T>) => Unsubscribe;
  on: (event: 'modified', subscriber: Subscriber<T>) => Unsubscribe;
  on: (event: 'error', subscriber: Subscriber<ErrorEvent>) => Unsubscribe;
}

type Condition = {
  [key: string]: Record<string, unknown>;
};

type Operation = unknown;

type Rule<Op> = {
  when: Condition[];
  then?: Op[];
  otherwise?: Op[];
};

type Options<T, C, Op> = {
  validator: Validator;
  context?: C;
  pattern?: RegExp;
  resolver?: Resolver;
  patch?: (operations: Op[], record: T) => T;
};

export default function createJSONModifiable<
  T,
  C = Record<string, unknown>,
  Op = JSONPatchOperation,
>(
  descriptor: T,
  rules: Rule<Op>[],
  options: Options<T, C, Op>,
): JSONModifiable<T, C, Op>;
