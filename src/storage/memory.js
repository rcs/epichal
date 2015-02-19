'use strict';
var _ = require('underscore');
var util = require('../util');
var async = require('async');


function MemoryStorage(){
  var self = this instanceof MemoryStorage ?
                  this :
                  Object.create(MemoryStorage.prototype);
  self._cache = {};
}

// Learn an observation
//
// @arg {String} modelName - the modelName we're learning for
// @arg {Object} context - the context we're learning a prediction for
// @arg {string} next - the succeeding element to learn
// @returns
MemoryStorage.prototype.learn = function(modelName, context, next, cb) {
  var contextKey = JSON.stringify(context);
  if( !this._cache[modelName] ) {
    this._cache[modelName] = {};
  }
  if( !this._cache[modelName][contextKey] ) {
    this._cache[modelName][contextKey] = {};
  }

  if( typeof this._cache[modelName][contextKey][next] === 'undefined' ) {
    this._cache[modelName][contextKey][next] = 1;
  } else {
    this._cache[modelName][contextKey][next] += 1;
  }
  if( cb ) { cb(); }
};

// Pick an observation from a model, weighted by learnings
//
// @arg {String} modelName - the modelName to pick from
// @arg {Object] context - the context for the prediction
//
// @returns {String}
MemoryStorage.prototype.pick = function(modelName, context, cb) {
  var contextKey = JSON.stringify(context);
  if( !this._cache[modelName] || !this._cache[modelName][contextKey] ) {
    return cb(null, undefined);
  }

  // Total is the number of things we've seen
  var total = util.sum(_.values(this._cache[modelName][contextKey]));
  var seen = Object.keys(this._cache[modelName][contextKey]);

  // Choose a random up to total
  var target = Math.floor(Math.random()*total);
  var acc = 0;
  for( var i = 0; i < seen.length; i++ ) {
    acc += this._cache[modelName][contextKey][seen[i]];
    if( acc > target ) {
      return cb(null, seen[i]);
    }
  }
  /* istanbul ignore next */
  throw new Error('something went wrong while finding a sample -- ' +
                  JSON.stringify(
                    {
                      target: target,
                      total: total,
                      modelName: modelName,
                      contextKey: contextKey,
                      weights: this._cache[modelName][contextKey],
                      model: this._cache[modelName],
                      cache: this._cache
                    },
                    null,
                    '  '
                  )
                );
};


// Pick multiple observations from a model, weighted by learnings
//
// @arg {String} modelName - the modelName to pick from
// @arg {Object} context - the context for the prediction
// @arg {Number} limit - the number of picks to return
//
// @returns {String}
MemoryStorage.prototype.pickMulti = function( modelName, context, limit, cb ) {
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
MemoryStorage.prototype.count = function(modelName, context, cb) {
  var contextKey = JSON.stringify(context);
  if( !this._cache[modelName] || !this._cache[modelName][contextKey] ) {
    return cb(null,0);
  }
  return cb(null, util.sum(_.values(this._cache[modelName][contextKey])));
};

MemoryStorage.prototype.surprise = function(modelName, context, seen, cb) {
  var contextKey = JSON.stringify(context);

  return cb(null, util.surprise(this._cache[modelName][contextKey], seen));
};


MemoryStorage.prototype.clear = function(modelName,cb) {
  this._cache[modelName] = {};
  /* istanbul ignore else */
  if( cb ) { cb(null,null); }
};

module.exports = MemoryStorage;
