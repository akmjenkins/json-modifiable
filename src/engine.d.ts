type Unsubscribe = () => void;
type Subscriber<T> = (arg: T) => void;

export type Validator = (schema: any, subject: any) => boolean;
export type Resolver<Context> = (object: Context, path: string) => any;

type ErrorEvent = {
  type: 'ValidationError' | 'PatchError';
  err: Error;
};

export type Context = Record<string, unknown>;
export type Descriptor = Record<string, unknown>;
export interface JSONModifiable<
  Descriptor,
  Operation = Partial<Descriptor>,
  Context,
> {
  get: () => Descriptor;
  set: (descriptor: Descriptor) => void;
  setRules: (rules: Rule<Operation>[]) => void;
  setContext: (context: Context) => void;
  subscribe: (subscriber: Subscriber<Descriptor>) => Unsubscribe;
  on: (event: 'modified', subscriber: Subscriber<Descriptor>) => Unsubscribe;
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
  context?: Context;
  pattern?: RegExp | null;
  resolver?: Resolver<Context>;
  patch?: (descriptor: Descriptor, operation: Operation) => Descriptor;
};

export function engine<Descriptor, Operation = Partial<Descriptor>, Context>(
  descriptor: Descriptor,
  validator: Validator,
  rules: Rule<Operation>[],
  options?: Options<Descriptor, Operation, Context>,
): JSONModifiable<Descriptor, Operation, Context>;
