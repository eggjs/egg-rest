'use strict';

exports.index = function* () {
  console.log('index');
};

exports.show = function* () {
  this.data = {
    pid: this.params.parent_id,
    id: this.params.id,
    cid: this.params.child_id,
    text: 'foo text',
  };
};
