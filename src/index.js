import { memoedInterpolate } from './interpolate';
import defaults from './options';

const shallowArrayEqual = (a, b) =>
  a === b || (a.length === b.length && a.every((c, i) => c === b[i]));

const memoRules = (rules, resolver, pattern) =>
  rules.map(({ when, then, otherwise }) => ({
    when:
      typeof when === 'function'
        ? when
        : memoedInterpolate(when, pattern, resolver),
    then:
      then === undefined || typeof then === 'function'
        ? then
        : memoedInterpolate(then, pattern, resolver),
    otherwise:
      otherwise === undefined || typeof otherwise === 'function'
        ? otherwise
        : memoedInterpolate(otherwise, pattern, resolver),
  }));

export default (
  descriptor,
  rules,
  { context, ...opts } = {},
  subscribers = new Map(),
  modified,
) => {
  const { pattern, validator, resolver, patch } = { ...defaults, ...opts };

  if (!validator) throw new Error(`A validator is required`);

  rules = memoRules(rules, resolver, pattern);

  let lastAppliedRules = [];

  modified = descriptor;
  const emit = (eventType, thing) => {
    const set = subscribers.get(eventType);
    set && set.forEach((s) => s(thing));
  };

  const notify = (next) => {
    if (modified === next) return;
    modified = next;
    emit('modified', modified);
  };

  const run = () => {
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
      .map((ops) => ops(context));

    if (shallowArrayEqual(rulesToApply, lastAppliedRules)) return;
    lastAppliedRules = rulesToApply;

    notify(
      rulesToApply.reduce((acc, ops) => {
        try {
          return patch(acc, ops);
        } catch (err) {
          emit('error', { type: 'PatchError', err });
          return acc;
        }
      }, descriptor),
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
    set: (d) => descriptor === d || run((descriptor = d)),
    setRules: (r) =>
      rules === r || run((rules = memoRules(r, resolver, pattern))),
    setContext: (ctx) => context === ctx || run((context = ctx)),
  };
};
