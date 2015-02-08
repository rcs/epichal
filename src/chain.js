'use strict';

var _ = require('underscore');


function Chain(options) {
  var self = this instanceof Chain ? this : Object.create(Chain.prototype);
  if( !options || !options.name ) {
    throw new Error('Must supply name');
  }
  self.storage = options.storage ? options.storage : require('./storage/memory');
  self.name = options.name;

  ['learn', 'pick', 'pickMulti', 'count', 'clear', 'uncertainty', 'surprise'].forEach( function(methodName) {
    self[methodName] = _.bind(self.storage[methodName], self, self.name);
  });

  return self;
}

module.exports = Chain;
