'use strict';

module.exports = {
  write: true,
  prefix: '^',
  devprefix: '^',
  test: [
    'test',
    'benchmark',
  ],
  exclude: [
    'test/fixtures',
    'dist',
  ],
  devdep: [
    'autod',
    'egg',
    'egg-ci',
    'egg-bin',
    'eslint',
    'eslint-config-egg',
    'supertest',
    'webstorm-disable-index',
  ],
};
