'use strict';
module.exports = function() {
  return function* () {
    this.body = 'rest hi';
  };
};
