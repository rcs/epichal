'use strict';


// Strategy used to build strings in reverse
function backward(tokenBuckets) {
  var context = ['<fence>', '<fence>'];
  var results = [];
  var reversedNorms = tokenBuckets.normalized.slice().reverse();

  reversedNorms.forEach(function(norm) {
    results.push({context: context, observed: norm});
    context = [context[1], norm];
  });
  results.push({context: context,observed: '<fence>'});

  return results;
}

module.exports = backward;
