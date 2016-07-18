'use strict';

module.exports = function(options) {
  return function* rest(next) {
    if (this.url.indexOf(options.urlprefix) === 0) {
      // Make sure all RESTful APIs always respond with json format
      this.response.type = 'json';
    }
    yield* next;
  };
};
