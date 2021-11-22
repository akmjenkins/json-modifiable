import { createStatefulRules } from './rule';
import { compareSets } from './utils';

const resolver = (context, key) => context[key];
const patch = (...args) => Object.assign({}, ...args);

export const engine = (
  descriptor,
  validator,
  rules = [],
  { context = {}, ...opts } = {},
  subscribers = new Map(),
  modified,
) => {
  opts = { resolver, patch, ...opts };

  if (!validator) throw new Error(`A validator is required`);
  if (!opts.patch) throw new Error(`A patch function is required`);
  if (!opts.resolver) throw new Error(`A resolver function is required`);

  rules = createStatefulRules(rules, { ...opts, validator });

  modified = descriptor;
  const emit = (eventType, thing) =>
    subscribers.get(eventType)?.forEach((s) => s(thing));

  const evaluate = (ops) =>
    ops.reduce((acc, op) => {
      try {
        return opts.patch(acc, op);
      } catch (err) {
        emit('error', { type: 'PatchError', err });
        return acc;
      }
    }, descriptor);

  const cache = new Map();
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
    const rulesToApply = rules(context);
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
    setContext: (ctx) => ctx === context || run((context = ctx)),
  };
};
