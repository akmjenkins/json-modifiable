const tilde = /~[01]/g;
const replacer = (m) => (m === '~1' ? '/' : '~');

const decodePointer = (pointer) =>
  tilde.test(pointer) ? pointer.replace(tilde, replacer) : pointer;

const compile = (pointer) => {
  try {
    return decodePointer(pointer).split('/').slice(1);
  } catch {
    throw new Error(`Invalid JSON Pointer ${pointer}`);
  }
};

const shallowClone = (thing) =>
  Array.isArray(thing)
    ? [...thing]
    : thing && typeof thing === 'object'
    ? { ...thing }
    : thing;

const _getPointerObj = (object, pointer) => {
  const compiled = compile(pointer);
  const last = compiled.pop();
  const next = shallowClone(object);
  const lastObject = compiled.reduce((acc, piece) => {
    if (typeof acc[piece] === 'undefined') {
      return (acc[piece] = piece < Infinity || piece === '-' ? [] : {});
    }
    return (acc[piece] = shallowClone(acc[piece]));
  }, next);

  return {
    last,
    next,
    lastObject,
  };
};

export const set = (object, pointer, value) => {
  const { last, next, lastObject } = _getPointerObj(object, pointer);
  // no mutations necessary, return the same reference
  if (lastObject[last] === value) return object;
  last === '-' ? lastObject.push(value) : (lastObject[last] = value);
  return next;
};

export const get = (object, pointer) =>
  compile(pointer).reduce((acc = {}, piece) => acc[piece], object);

export const unset = (object, pointer) => {
  const { last, next, lastObject } = _getPointerObj(object, pointer);

  if (last === '-') lastObject.pop();
  if (typeof lastObject[last] === 'undefined') return object;
  Array.isArray(lastObject)
    ? lastObject.splice(last, 1)
    : delete lastObject[last];
  return next;
};
