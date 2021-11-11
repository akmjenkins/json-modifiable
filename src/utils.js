export const compareSets = (a, b) => {
  if (a.size !== b.size) return false;
  for (const value of a) if (!b.has(value)) return false;
  return true;
};

export const areArraysEqual = (a, b) =>
  a.length === b.length && a.every((c, i) => b[i] === c);
