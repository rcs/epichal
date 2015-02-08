'use strict';

// Strategy used to build strings forward
function forward(tokenBuckets) {
  var context = ['<fence>', '<fence>'];
  var results = [];
  var norms = tokenBuckets.normalized;


  norms.forEach(function(norm) {
    results.push({context: context, observed: norm});
    context = [context[1], norm];
  });
  results.push({context: context,observed: '<fence>'});

  return results;
}

module.exports = forward;
