// a stateful rule only tries to be evaluated if dependencies have changed since it was last ran?
// can we have an unlimited cache for this rule?
// [reference of rule]: [dependencies,value]
// unlimited caching so we don't have to re-evaluate?
import interpolatable from 'interpolatable';
import { areArraysEqual } from './utils';

const evalMap = (map, context, { validator, resolver }) =>
  Object.entries(map).every(([key, schema]) => {
    return validator(schema, resolver(context, key));
  });

const createStatefulMap = (when, options) => {
  const deps = Object.keys(when).map(
    (key) => (context) => options.resolver(context, key),
  );

  let lastDeps = [];
  let lastWhen;
  let last;
  when = interpolatable(when, options);
  return (context) => {
    const nextWhen = when(context);
    const run = () => (last = evalMap(nextWhen, context, options));
    if (nextWhen !== lastWhen) {
      lastWhen = nextWhen;
      lastDeps = deps.map((d) => d(context));
      return run();
    }

    const nextDeps = deps.map((d) => d(context));
    if (areArraysEqual(nextDeps, lastDeps)) return last;
    lastDeps = nextDeps;
    return run();
  };
};

const createStatefulRule = ({ when, then, otherwise }, options) => {
  when = when.map((w) => createStatefulMap(w, options));
  then = interpolatable(then, options);
  otherwise = interpolatable(otherwise, options);

  return (context) =>
    (when.some((w) => w(context)) ? then : otherwise)(context);
};

export const createStatefulRules = (rules, options) => {
  rules = rules.map((rule) => createStatefulRule(rule, options));
  return (context) => rules.map((rule) => rule(context));
};
