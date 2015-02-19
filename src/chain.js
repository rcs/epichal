'use strict';

var _ = require('underscore');
var MemoryStorage = require('./storage/memory');


function Chain(options) {
  var self = this instanceof Chain ? this : Object.create(Chain.prototype);
  if( !options || !options.name ) {
    throw new Error('Must supply name');
  }
  self.storage = options.storage ? options.storage : new MemoryStorage();
  self.name = options.name;

  ['learn', 'pick', 'pickMulti', 'count', 'clear', 'surprise'].forEach( function(methodName) {
    self[methodName] = _.bind(self.storage[methodName], self.storage, self.name);
  });

  return self;
}

module.exports = Chain;
