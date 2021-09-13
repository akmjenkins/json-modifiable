import { set, unset, get } from './pointer';

const _patch = (obj, { op, from, path, value }) => {
  switch (op) {
    case 'replace':
    case 'add':
      return set(obj, path, value);
    case 'remove':
      return unset(obj, path);
    case 'copy':
      if (!from) throw new Error('from is required for copy operation');
      return set(obj, path, get(obj, from));
    case 'move':
      if (!from) throw new Error('from is required for move operation');
      return set(obj, path, unset(obj, from));
    case 'test': {
      const resolved = JSON.stringify(get(obj, path));
      if (resolved !== JSON.stringify(value)) {
        throw new Error(
          `test of ${path} for ${value} failed - received ${resolved}`,
        );
      }
      return obj;
    }
    default:
      throw new Error(`Operation ${op} not supported`);
  }
};

export const patch = (obj, operations) => operations.reduce(_patch, obj);
