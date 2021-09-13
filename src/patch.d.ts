type AddOperation<T = unknown> = {
  op: 'add';
  path: string;
  value: T;
};

type RemoveOperation = {
  op: 'remove';
  path: string;
};

type ReplaceOperation<T = unknown> = {
  op: 'replace';
  path: string;
  value: T;
};

type CopyOperation = {
  op: 'copy';
  path: string;
  from: string;
};

type MoveOperation = {
  op: 'move';
  path: string;
  from: string;
};

type TestOperation<T = unknown> = {
  op: 'test';
  path: string;
  value: T;
};

export type JSONPatchOperation =
  | AddOperation
  | RemoveOperation
  | ReplaceOperation
  | CopyOperation
  | MoveOperation
  | TestOperation;

export function patch<T>(doc: T | Partial<T>, ops: JSONPatchOperation[]): T;
