'use strict';
var Chain = require('./chain');
var async = require('async');


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
Model.prototype.learn = function(input, cb) {
  var self = this;
  var tokenBuckets = self.tokenizer(input);
  async.each(self.strategy(tokenBuckets), function(observation, next) {
      self.chain.learn(observation.context, observation.observed, next);
    },
    function(err) {
      cb(err);
    }
  );
};

Model.prototype.clear = function(cb) {
  return this.chain.clear(cb);
};

Model.prototype.pick = function(context, cb) {
  return this.chain.pick(context, cb);
};

Model.prototype.walk = function(context,keywords, cb) {
  var results = [];
  var localContext = context.slice();
  var next;

  if( typeof keywords === 'function' ) {
    cb = keywords;
    keywords = [];
  }
  async.doWhilst(
    function(cb) {
      this.chain.pickMulti(localContext, 10, function(err,res) {
        next = this.bestNext(res, keywords);
        // We broke.
        if( typeof next === 'undefined' ) {
          return cb(true);
        }
        // We hit the end
        if( next === '<fence>') {
          return cb();
        }
        results.push(next);
        localContext = [localContext[1], next];
        cb();
      }.bind(this));
    }.bind(this),
    function() { return next !== '<fence>'; },
    function(err) {
      if( err ) {
        cb(null, undefined);
      } else {
        cb( null, results );
      }
    }
  );
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

Model.prototype.uncertainty = function(context, cb) {
  return this.chain.uncertainty(context, cb);
};

Model.prototype.surprise = function(context, seen, cb) {
  return this.chain.surprise(context, seen, cb);
};


module.exports = Model;
