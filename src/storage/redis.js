'use strict';
var _ = require('underscore');
var util = require('../util');
var async = require('async');

function RedisStorage(options) {
  var self = this instanceof RedisStorage ? this : Object.create(RedisStorage.prototype);
  options = _.defaults( options || {}, {
    prefix: 'node-megahal-redis'
  });

  if( !options.client ) {
    throw new Error('Redis client required');
  }

  self.prefix = options.prefix;
  self.client = options.client;
  ['clear', 'surprise', 'count', 'pickMulti', 'pick', 'learn'].forEach(function(m) {
    self[m].bind(self);
  });

  return self;

}

RedisStorage.prototype.keyName = function(modelName, context) {
  return [this.prefix, modelName, JSON.stringify(context)].join(':');
};

// Learn an observation
//
// @arg {String} modelName - the modelName we're learning for
// @arg {Object} context - the context we're learning a prediction for
// @arg {string} next - the succeeding element to learn
// @returns
RedisStorage.prototype.learn = function(modelName, context, next, cb) {
  this.client.hincrby([this.keyName(modelName,context), next, 1], function(err, res) {
    if( cb ) { cb(err,res); }
  });
};
function intifyResponse(res) {
  var out = _.reduce(_.keys(res), function(memo,key) {
    memo[key] = parseInt(res[key],10);
    return memo;
  },{});
  return out;
}

// Pick an observation from a model, weighted by learnings
//
// @arg {String} modelName - the modelName to pick from
// @arg {Object] context - the context for the prediction
//
// @returns {String}
RedisStorage.prototype.pick = function(modelName, context, cb) {
  this.client.hgetall(this.keyName(modelName,context), function(err,res) {
    /* istanbul ignore if */ if( err ) { return cb(err); }
    if( res === null ) {
      return cb(null, undefined);
    }
    var weights = intifyResponse(res);

    // Total is the number of things we've seen
    var total = util.sum(_.values(weights));
    var weightKeys = Object.keys(weights);

    // Choose a random up to total
    var target = Math.floor(Math.random()*total);
    var acc = 0;
    for( var i = 0; i < weightKeys.length; i++ ) {
      acc += weights[weightKeys[i]];
      /* istanbul ignore else */
      if( acc > target ) {
        return cb(null, weightKeys[i]);
      }
    }

    /* istanbul ignore next */
    throw new Error('something went wrong while finding a sample -- ' +
                  JSON.stringify(
                    {target: target, total: total, weights: weights},
                    null, '  '
                  ));
  });
};


// Pick multiple observations from a model, weighted by learnings
//
// @arg {String} modelName - the modelName to pick from
// @arg {Object} context - the context for the prediction
// @arg {Number} limit - the number of picks to return
//
// @returns {String}
RedisStorage.prototype.pickMulti = function( modelName, context, limit, cb ) {
  if( typeof limit === 'function' ) {
    cb = limit;
    limit = 1;
  }
  var self = this;
  async.times(limit, function(n, next) {
    self.pick(modelName, context, next);
  }, function(err,results) {
    cb(err, results);
  });
};

// The count of learnings for a context
//
// @arg {String} - the modelName to check
// @arg {Object} - the context to count
//
// @returns {int}
RedisStorage.prototype.count = function(modelName, context, cb) {
  this.client.hgetall(this.keyName(modelName,context), function(err,res) {
    /* istanbul ignore if */ if( err ) { return cb(err); }
    var weights = intifyResponse(res);
    cb( null, util.sum(_.values(weights)));
  });

};

RedisStorage.prototype.surprise = function(modelName, context, seen, cb) {
  this.client.hgetall(this.keyName(modelName,context), function(err,res) {
    /* istanbul ignore if */ if( err ) { return cb(err); }

    var weights = intifyResponse(res);
    cb( null, util.surprise(weights, seen));
  });
};

RedisStorage.prototype.clear = function(modelName,cb) {
  var self = this;
  self.client.keys([self.prefix, modelName, '*'].join(':'), function(err,res) {
    /* istanbul ignore if */ if( err ) { return cb(err); }
    self.client.del(res, function(err,res) {
      /* istanbul ignore if */ if( err ) { return cb(err); }
      cb(err,res);
    });
  });
};

module.exports = RedisStorage;
