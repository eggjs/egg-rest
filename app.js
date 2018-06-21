'use strict';

const assert = require('assert');
const loadApi = require('./lib/load_api');

// load all js files in app/api/ directory automatically
module.exports = app => {
  // remove existed rest plugin configuration to prevent error configurations.
  const index = app.config.appMiddleware.indexOf('rest');
  assert.equal(index, -1, 'Duplication of middleware name found: rest. Rename your middleware other than "rest" please.');
  // put rest middleware in the first place
  app.config.coreMiddleware.unshift('rest');

  // make sure that REST APIs are loaded after the router taking effect
  process.nextTick(function() {
    loadApi(app);
  });
};
