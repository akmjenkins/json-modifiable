type Unsubscribe = () => void;
type Subscriber<T> = (arg: T) => void;

type Validator = (schema: any, subject: any) => boolean;
type Resolver<Context> = (object: Context, path: string) => any;

type ErrorEvent = {
  type: 'ValidationError' | 'PatchError';
  err: Error;
};

export type Context = Record<string, unknown>;
export type Descriptor = Record<string, unknown>;
export interface JSONModifiable<Descriptor, Op = Partial<T>, Context> {
  get: () => Descriptor;
  set: (descriptor: Descriptor) => void;
  setRules: (rules: Rule<Op>[]) => void;
  setContext: (context: Context) => void;
  subscribe: (subscriber: Subscriber<T>) => Unsubscribe;
  on: (event: 'modified', subscriber: Subscriber<T>) => Unsubscribe;
  on: (event: 'error', subscriber: Subscriber<ErrorEvent>) => Unsubscribe;
}

type Condition = {
  [key: string]: Record<string, unknown>;
};

export type Rule<Operation> = {
  when: Condition[];
  then?: Operation;
  otherwise?: Operation;
};

export type Options<Descriptor, Operation, Context> = {
  validator: Validator;
  context?: Context;
  pattern?: RegExp | null;
  resolver?: Resolver<Context>;
  patch?: (descriptor: Descriptor, operation: Operation) => T;
};

export function engine<Descriptor, Op = Partial<T>, Context>(
  descriptor: Descriptor,
  rules: Rule<Op>[],
  options: Options<Descriptor, Op, Context>,
): JSONModifiable<Descriptor, Op, Context>;
