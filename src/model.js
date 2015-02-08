'use strict';
var Chain = require('./chain');


function Model(options) {
  var self = this instanceof Model ? this : Object.create(Model.prototype);
  if( !options || !options.name ) {
    throw new Error('Must supply name');
  }

  self.tokenizer = options.tokenizer || require('./tokenize').tokenize;
  self.chain = options.chain || Chain(options);
  self.strategy = options.strategy || require('./model_strategy/forward');

  return self;
}

// Take a line of input to learn
Model.prototype.learn = function(input) {
  var tokenBuckets = this.tokenizer(input);
  this.strategy(tokenBuckets).forEach(function(observation) {
    this.chain.learn(observation.context, observation.observed);
  }.bind(this));
};

Model.prototype.clear = function() {
  return this.chain.clear();
};

Model.prototype.pick = function(context) {
  return this.chain.pick(context);
};

Model.prototype.walk = function(context,keywords) {
  var results = [];
  var localContext = context.slice();
  var next;
  do {
    // TODO remove found keyword?
    next = this.bestNext(this.chain.pickMulti(localContext,10),keywords);
    if( typeof next === 'undefined' ) {
      return;
    }
    if( next === '<fence>' ) {
      return results;
    }
    results.push(next);
    localContext = [localContext[1], next];
  } while(next !== '<fence>');
};

Model.prototype.bestNext = function(possibles, keywords) {
  if( typeof keywords === 'undefined' ) {
    return possibles[0];
  }
  var matched;
  possibles.forEach(function(possible) {
    if( keywords.indexOf(possible) !== -1 ) {
      matched = possible;
    }
  });
  return matched ? matched : possibles[0];
};

Model.prototype.uncertainty = function(context) {
  return this.chain.uncertainty(context);
};
Model.prototype.surprise = function(context, seen) {
  return this.chain.surprise(context, seen);
};


module.exports = Model;
