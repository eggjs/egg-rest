'use strict';

exports.index = function* () {
  const err = new Error('param not valid');
  err.status = 400;
  err.code = 'NOT_VALID';
  throw err;
};
