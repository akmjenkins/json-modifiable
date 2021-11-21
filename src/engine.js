import { createStatefulRules } from './rule';
import { compareSets } from './utils';

const resolver = (context, key) => context[key];
const patch = (record, patch) => ({ ...record, ...patch });

const defaults = { resolver, patch };

export const engine = (
  descriptor,
  rules = [],
  { context = {}, ...opts } = {},
  subscribers = new Map(),
  modified,
) => {
  opts = { ...defaults, ...opts };

  if (!opts.validator) throw new Error(`A validator is required`);
  if (!opts.patch) throw new Error(`A patch function is required`);
  if (!opts.resolver) throw new Error(`A resolver function is required`);

  rules = createStatefulRules(rules, opts);

  modified = descriptor;
  const cache = new Map();
  const emit = (eventType, thing) => {
    const set = subscribers.get(eventType);
    set && set.forEach((s) => s(thing));
  };

  const evaluate = (ops) =>
    ops.reduce((acc, ops) => {
      try {
        return opts.patch(acc, ops);
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
    const rulesToApply = rules(context, opts);
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
    setContext: (ctx) => run((context = ctx)),
  };
};
