'use strict';
var _ = require('underscore');

// Strategy used to figure out what punctuation to put between two words
function punc(tokenBuckets) {
  var context = ['<fence>', '<fence>'];
  var results = [];

  _.zip(tokenBuckets.punctuation, tokenBuckets.words.concat('<fence>')).forEach(function(mapping) {
    var punc = mapping[0],
        word = mapping[1];

    context = [context[1], word];
    results.push({context: context, observed: punc});
  });

  return results;
}

module.exports = punc;
