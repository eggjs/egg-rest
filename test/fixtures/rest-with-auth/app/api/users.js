'use strict';

exports.show = function* () {
  this.data = this.accessToken;
};

exports.index = function* () {
  this.data = [];
};
