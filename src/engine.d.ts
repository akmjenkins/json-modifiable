type Unsubscribe = () => void;
type Subscriber<T> = (arg: T) => void;

export type Validator<Schema = unknown> = (
  schema: Schema,
  subject: any,
) => boolean;
export type Resolver<Context = Record<string, unknown>> = (
  object: Context,
  path: string,
) => any;

type ErrorEvent = {
  type: 'ValidationError' | 'PatchError';
  err: Error;
};

export interface JSONModifiable<Descriptor, Schema, Operation, Context> {
  get: () => Descriptor;
  set: (descriptor: Descriptor) => void;
  setRules: (rules: Rule<Operation, Schema>[]) => void;
  setContext: (context: Context) => void;
  subscribe: (subscriber: Subscriber<Descriptor>) => Unsubscribe;
  on: (event: 'modified', subscriber: Subscriber<Descriptor>) => Unsubscribe;
  on: (event: 'error', subscriber: Subscriber<ErrorEvent>) => Unsubscribe;
}

export type Condition<Schema> = Record<string, Schema>;

export type Rule<Operation, Schema = unknown> = {
  when: Condition<Schema>[];
  then?: Operation;
  otherwise?: Operation;
};

export type Options<Descriptor, Operation, Context> = {
  context?: Context;
  pattern?: RegExp | null;
  resolver?: Resolver<Context>;
  patch?: (descriptor: Descriptor, operation: Operation) => Descriptor;
};

export function engine<
  Descriptor = Record<string, unknown>,
  Schema = unknown,
  Operation = Partial<Descriptor>,
  Context = unknown,
>(
  descriptor: Descriptor,
  validator: Validator<Schema>,
  rules: Rule<Operation, Schema>[],
  options?: Options<Descriptor, Operation, Context>,
): JSONModifiable<Descriptor, Operation, Context>;
