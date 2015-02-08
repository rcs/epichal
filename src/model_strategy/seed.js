'use strict';

// Strategy used to take a given word and find what should go next to it
function seed(tokenBuckets) {
  var context;
  var results = [];
  var norms = tokenBuckets.normalized;
  var prev = '<fence>';

  norms.concat('<fence>').forEach(function(norm) {
    context = [prev, '<blank>'];
    results.push({context: context, observed: norm});
    context = ['<blank>', norm];
    results.push({context: context, observed: prev});
    prev = norm;
  });

  return results;
}

module.exports = seed;
