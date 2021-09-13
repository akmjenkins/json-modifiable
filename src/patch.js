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
      return set(unset(obj, from), path, get(obj, from));
    case 'test': {
      const resolved = JSON.stringify(get(obj, path));
      if (resolved !== JSON.stringify(value)) {
        throw new Error(
          `test operation error - test of ${path} for ${value} failed - received ${resolved}`,
        );
      }
      return obj;
    }
    default:
      throw new Error(`Operation ${op} not supported`);
  }
};

export const patch = (obj, operations) => {
  try {
    return operations.reduce(_patch, obj);
  } catch (err) {
    if (/test operation error/.test(err.message)) return obj;
    throw err;
  }
};
