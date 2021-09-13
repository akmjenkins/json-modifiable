module.exports = {
  transform: {
    '^.+\\.jsx?$': require.resolve('babel-jest'),
    '^.+\\.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(node-fetch|fetch-blob)/)'],
  collectCoverageFrom: ['./src/*.js'],
};
