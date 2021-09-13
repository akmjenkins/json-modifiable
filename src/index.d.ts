type Unsubscribe = () => void;
type Subscriber<T> = (arg: T) => void;

type ErrorEvent = any;

interface JSONModifiable<T, C> {
  get: () => T;
  set: (descriptor: T) => void;
  setRules: (rules: Rule<T>[]) => void;
  setContext: (context: C) => void;
  subscribe: (subscriber: Subscriber<T>) => Unsubscribe;
  on: (event: 'modified', subscriber: Subscriber<T>) => Unsubscribe;
  on: (event: 'error', subscriber: Subscriber<ErrorEvent>) => Unsubscribe;
}

type Condition = {
  [key: string]: Record<string, unknown>;
};

type Operation = unknown;

type Rule = {
  when: Condition[];
  then?: Operation[];
  otherwise?: Operation[];
};

type Options<T> = {
  validator: (schema: any, subject: any) => boolean;
  pattern?: RegExp;
  resolver?: (object: Record<string, unknown>, path: string) => any;
  patch?: (operations: Operations, record: T) => T;
};

export default function createJSONModifiable<T, C = unknown>(
  descriptor: T,
  rules: Rule[],
  options: Options<T>,
): JSONModifiableDescriptor<T, C>;
