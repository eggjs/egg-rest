'use strict';

const restc = require('restc');

module.exports = options => {
  const middleware = restc.koa();
  return function* rest(next) {
    if (this.url.indexOf(options.urlprefix) === 0) {
      // if request with ?debug at development, then respond debug panel
      if (!options.production && this.query.hasOwnProperty('debug')) {
        yield middleware.call(this, next);
      } else {
        // Make sure all RESTful APIs always respond with json format
        this.response.type = 'json';
      }
    }
    yield* next;
  };
};
