'use strict';
var _ = require('underscore');

function mergeModels(a,b) {
  var newModel = {};
  Object.keys(a).forEach(function(key) {
    newModel[key] = a[key];
  });

  Object.keys(b).forEach(function(key) {
    if( newModel[key] ) {
      newModel[key] = newModel[key].concat(b[key]);
    } else {
      newModel[key] = b[key];
    }
  });

  return newModel;

}
//
// Return the sum of a list
//
// @arg {Array} arr - list to sum
// @returns {Number}
function sum(arr) {
  return _.reduce(arr,function(memo,num) { return memo + num; }, 0);
}


// Measure the amount of uncertainy when picking an item ar random from a mapping
//
// @arg {mapping{String,Number}} weights = The object to measure. Keys are the
//      possible responses, values are the weight
function uncertainty(weights) {
  if( typeof weights === 'undefined' ) {
    return;
  }
  var values = _.values(weights);

  var totalSeen = sum(values);
  if( totalSeen < 1 ) {
    return;
  }
  return _.reduce(values, function(acc, count) {
    var freq = count/totalSeen;
    return acc - freq*Math.log(freq)/Math.LN2;
  }, 0);
}

// measure how surprising it is to see something given a set of weights
// @arg {mapping{String,Number}} weights = The object to measure. Keys are the
//      possible responses, values are the weight
// @arg {String} seen - the thing we've seen
function surprise(weights, seen) {
  if( typeof weights === 'undefined' || typeof weights[seen] === 'undefined' ) {
    return;
  }
  var total = sum(_.values(weights));

  return -1* Math.log(weights[seen]/total)/Math.LN2;
}

module.exports = {
  mergeModels: mergeModels,
  uncertainty: uncertainty,
  surprise: surprise,
  sum: sum
};
