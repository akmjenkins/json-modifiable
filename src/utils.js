import interpolatable from 'interpolatable';

export const compareSets = (a, b) => {
  if (a.size !== b.size) return false;
  for (const value of a) if (!b.has(value)) return false;
  return true;
};

export const memoRules = (rules, opts) =>
  rules.map(({ when, then = {}, otherwise = {} }) => ({
    when: interpolatable(when, opts),
    then: interpolatable(then, opts),
    otherwise: interpolatable(otherwise, opts),
  }));
