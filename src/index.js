import { interpolate } from './interpolate';
import defaults from './options';

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
    let m = subscribers.get(eventType);
    m
      ? m.add(subscriber)
      : subscribers.set(eventType, (m = new Set([subscriber])));

    return () => subscribers.get(eventType).delete(subscriber);
  };

  return {
    on,
    subscribe: (subscriber) => on('modified', subscriber),
    get: () => modified,
    set: (d) => descriptor === d || run((descriptor = d), cache.clear()),
    setRules: (r) => rules === r || run((rules = r)),
    setContext: (ctx) => context === ctx || run((context = ctx)),
  };
};
