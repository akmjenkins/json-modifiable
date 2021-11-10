import defaults from './options';
import { compareSets, memoRules } from './utils';

export default (
  descriptor,
  rules = [],
  { context, ...opts } = {},
  subscribers = new Map(),
  modified,
) => {
  const { pattern, validator, resolver, patch } = { ...defaults, ...opts };

  if (!validator) throw new Error(`A validator is required`);

  rules = memoRules(rules, { pattern, resolver });

  modified = descriptor;
  const cache = new Map();
  const cachedRules = new Set();
  const emit = (eventType, thing) => {
    const set = subscribers.get(eventType);
    set && set.forEach((s) => s(thing));
  };

  const evaluate = (ops) =>
    ops.reduce((acc, ops) => {
      try {
        return patch(acc, ops);
      } catch (err) {
        emit('error', { type: 'PatchError', err });
        return acc;
      }
    }, descriptor);

  const getCached = (ops) => {
    for (const [key, value] of cache) if (compareSets(key, ops)) return value;
  };

  const notify = (next, key) => {
    if (modified === next) return;
    cache.set(key, next);
    modified = next;
    emit('modified', modified);
  };

  const run = () => {
    let isCached;
    const rulesToApply = rules
      .map(
        ({ when, then, otherwise }) =>
          (when(context).some((rule) =>
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
      .map((ops) => {
        const result = ops(context);
        if (!cachedRules.has(result)) {
          isCached = false;
          cachedRules.add(result);
        } else {
          isCached = isCached ?? true;
        }
        return result;
      });

    const ops = new Set(rulesToApply);
    notify(getCached(ops) || evaluate(rulesToApply), ops);
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
    setRules: (r) => run((rules = memoRules(rules, { pattern, resolver }))),
    setContext: (ctx) => context === ctx || run((context = ctx)),
  };
};
