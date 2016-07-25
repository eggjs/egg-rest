'use strict';

exports.index = function* () {
  /* eslint-disable */
  aaa;
  /* eslint-enable */
};

exports.show = function* () {
  this.data = {
    pid: this.params.parent_id,
    id: this.params.id,
    text: 'foo text',
  };
};
