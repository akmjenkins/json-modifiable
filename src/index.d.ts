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

export type Rule<Op = Record<string, unknown>> = {
  when: Condition[];
  then?: Op;
  otherwise?: Op;
};

type Options<T, C, Op> = {
  validator: Validator;
  context?: C;
  pattern?: RegExp | null;
  resolver?: Resolver;
  patch?: (record: T, operations: Op) => T;
};

export default function createJSONModifiable<
  T,
  C = Record<string, unknown>,
  Op = unknown,
>(
  descriptor: T,
  rules: Rule<Op>[],
  options: Options<T, C, Op>,
): JSONModifiable<T, C, Op>;
