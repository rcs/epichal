'use strict';

var _ = require('underscore');

// Strategy used to take NORMALIZED WORDS and turn them into a better casing
function caseStrategy(tokenBuckets) {
  var context = ['<fence>', '<fence>'];
  var results = [];

  _.zip( tokenBuckets.words, tokenBuckets.normalized ).forEach(function(mapping) {
    var word = mapping[0],
        norm = mapping[1];

    context = [context[0], norm];
    results.push({context: context, observed: word});
    context = [word, norm];
  });

  return results;
}

module.exports = caseStrategy;
