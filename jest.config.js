module.exports = {
  transform: {
    '^.+\\.jsx?$': require.resolve('babel-jest'),
    '^.+\\.ts?$': 'ts-jest',
  },
  collectCoverageFrom: ['./src/*.js'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 95,
      lines: 90,
      statements: 90,
    },
  },
};
