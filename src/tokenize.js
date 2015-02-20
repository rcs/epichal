'use strict';
var _ = require('underscore');

function compoundWords(tokens) {
  var compounds = [];
  for( var i = 0; i <= tokens.length - 1; i++ ) {
    if( tokens[i+1] && tokens[i+1].match(/^[-']$/) ) {
      compounds.push( [tokens[i], tokens[i+1], tokens[i+2]].join('') );
      i = i+2;
    }
    else {
      compounds.push(tokens[i]);
    }
  }

  return compounds;
}
// Take a string, turn it into a map of start and following states
// @example
// // returns {
//  '<start> <start>': [start'the'],
//  '<start> the': ['fox'],
//  'the fox': ['ran'],
//  'fox ran': ['down']
//  'ran down': ['the']
//  'down the': ['fancy']
//  'the fancy': ['hill']
// splitInput('the fox ran down the fancy hill');
//
function tokenizeInput(input) {
  if( !input ) {
    return [];
  }
  var tokens = input.split(/\b/);
  // Make sure we start with a non-word
  if( tokens[0].match(/\w/) ){
    tokens.unshift('');
  }
  if( tokens[tokens.length - 1].match(/\w/) ){
    tokens.push('');
  }

  // Rejoin words that got split. ['fancy', '-', 'pants'] -> 'fancy-pants'
  var compounded = compoundWords(tokens);

  // Split the stream into words and punctuation
  var partitioned = _.partition(compounded, function(val,key) {
    return key % 2 === 0;
  });

  return {
    punctuation: partitioned[0],
    words: partitioned[1],
    normalized: _.map(partitioned[1], function(word) { return word.toUpperCase(); })
  };
}

module.exports = {
  tokenize: tokenizeInput,
  compoundWords: compoundWords
};
