'use strict';
var _ = require('underscore');
var util = require('../util');

var cache = {};

// Learn an observation
//
// @arg {String} modelName - the modelName we're learning for
// @arg {Object} context - the context we're learning a prediction for
// @arg {string} next - the succeeding element to learn
// @returns
function learn(modelName, context, next) {
  var contextKey = JSON.stringify(context);
  if( !cache[modelName] ) {
    cache[modelName] = {};
  }
  if( !cache[modelName][contextKey] ) {
    cache[modelName][contextKey] = {};
  }

  if( typeof cache[modelName][contextKey][next] === 'undefined' ) {
    cache[modelName][contextKey][next] = 1;
  } else {
    cache[modelName][contextKey][next] += 1;
  }
}

// Pick an observation from a model, weighted by learnings
//
// @arg {String} modelName - the modelName to pick from
// @arg {Object] context - the context for the prediction
//
// @returns {String}
function pick(modelName, context) {
  var contextKey = JSON.stringify(context);
  if( !cache[modelName] || !cache[modelName][contextKey] ) {
    return;
  }

  // Total is the number of things we've seen
  var total = util.sum(_.values(cache[modelName][contextKey]));
  var seen = Object.keys(cache[modelName][contextKey]);
  if( seen.length < 1 ) {
    return;
  }
  // Choose a random up to total
  var target = Math.floor(Math.random()*total);
  var acc = 0;
  for( var i = 0; i < seen.length; i++ ) {
    acc += cache[modelName][contextKey][seen[i]];
    if( acc > target ) {
      return seen[i];
    }
  }
  throw new Error('something went wrong while finding a sample -- ' +
                  JSON.stringify(
                    {target: target, total: total, modelName: modelName, contextKey: contextKey, weights: cache[modelName][contextKey], model: cache[modelName], cache: cache},
                    null, '  '
                  ));
}


// Pick multiple observations from a model, weighted by learnings
//
// @arg {String} modelName - the modelName to pick from
// @arg {Object} context - the context for the prediction
// @arg {Number} limit - the number of picks to return
//
// @returns {String}
function pickMulti( modelName, context, limit ) {
  var results = [];
  if( typeof limit === 'undefined' ) {
    limit = 1;
  }
  for( var i = 0; i < limit; i++ ) {
    results.push(pick(modelName,context));
  }
  return results;
}
// The count of learnings for a context
//
// @arg {String} - the modelName to check
// @arg {Object} - the context to count
//
// @returns {int}
function count(modelName, context) {
  var contextKey = JSON.stringify(context);
  if( !cache[modelName] || !cache[modelName][contextKey] ) {
    return 0;
  }
  return util.sum(_.values(cache[modelName][contextKey]));
}

function uncertainty(modelName, context) {
  var contextKey = JSON.stringify(context);

  return util.uncertainty(cache[modelName][contextKey]);
}
function surprise(modelName, context, seen) {
  var contextKey = JSON.stringify(context);

  return util.surprise(cache[modelName][contextKey], seen);
}


function clear(modelName) {
  cache[modelName] = {};
}
module.exports = {
  learn: learn,
  count: count,
  pick: pick,
  pickMulti: pickMulti,
  clear: clear,
  uncertainty: uncertainty,
  surprise: surprise
};
