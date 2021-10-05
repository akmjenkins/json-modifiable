import { interpolate } from './interpolate';
import defaults from './options';

// get the pointers from the factmaps, get all the dependencies, put them in an object with the pointer as the key and the value as the value?
// this requires a shallow equal - if we just map the args to an array than we can use isEqual
// we should also cache the pointers so we don't have to do lookups during each run

export default (
  descriptor,
  rules,
  { context, ...opts } = {},
  subscribers = new Map(),
  modified,
) => {
  const { pattern, validator, resolver, patch } = { ...defaults, ...opts };

  if (!validator) throw new Error(`A validator is required`);

  modified = descriptor;
  const cache = new Map();
  const emit = (eventType, thing) => {
    const set = subscribers.get(eventType);
    set && set.forEach((s) => s(thing));
  };

  const notify = (next, cacheKey) => {
    if (modified === next) return;
    modified = next;
    cache.set(cacheKey, next);
    emit('modified', modified);
  };

  const run = () => {
    const rulesToApply = rules
      .map(
        ({ when, then, otherwise }) =>
          (interpolate(when, context, pattern, resolver).some((rule) =>
            Object.entries(rule).every(([key, schema]) => {
              try {
                return validator(schema, resolver(context, key));
              } catch (err) {
                emit('error', { type: 'ValidationError', err });
              }
            }),
          )
            ? then
            : otherwise) || [],
      )
      .map((ops) => interpolate(ops, context, pattern, resolver));

    const cacheKey = JSON.stringify(rulesToApply);
    const cached = cache.get(cacheKey);

    notify(
      cached
        ? cached
        : rulesToApply.reduce((acc, ops) => {
            try {
              return patch(acc, ops);
            } catch (err) {
              emit('error', { type: 'PatchError', err });
              return acc;
            }
          }, descriptor),
      cacheKey,
    );
  };

  // run immediately
  run();

  const on = (eventType, subscriber) => {
    subscribers.get(eventType)?.add(subscriber) ||
      subscribers.set(eventType, new Set([subscriber]));
    return () => subscribers.get(eventType).delete(subscriber);
  };

  return {
    on,
    subscribe: (subscriber) => on('modified', subscriber),
    subscribeTo: (path, subscriber) => {
      let last = resolver(descriptor, path);
      return on('modified', (descriptor) => {
        const next = resolver(descriptor, path);
        last === next || subscriber((last = next));
      });
    },
    get: () => modified,
    set: (d) => descriptor === d || run((descriptor = d), cache.clear()),
    setRules: (r) => rules === r || run((rules = r)),
    setContext: (ctx) => context === ctx || run((context = ctx)),
  };
};
