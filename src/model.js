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

Model.prototype.surprise = function(context, seen, cb) {
  return this.chain.surprise(context, seen, cb);
};

Model.prototype.walk = function(context,keywords, cb) {
  var results = [];
  var localContext = context.slice();
  var next;

  if( typeof keywords === 'function' ) {
    cb = keywords;
    keywords = [];
  }
  var self = this;
  async.doWhilst(
    function(cb) {
      self.chain.pickMulti(localContext, 10, function(err,res) {
        next = self.bestNext(res, keywords);
        // We broke.
        if( typeof next === 'undefined' ) {
          var e = new Error();
          e.name = 'GenerationError';
          return cb(e);
        }
        // We hit the end
        if( next === '<fence>') {
          return cb();
        }
        results.push(next);
        localContext = [localContext[1], next];
        cb();
      });
    },
    function() { return next !== '<fence>'; },
    function(err) {
      if( err && err.name === 'GenerationError' ) {
        return cb(null, undefined);
      }
      /* istanbul ignore if */ if( err ) { return cb(err); }
      cb(null, results);
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



module.exports = Model;
