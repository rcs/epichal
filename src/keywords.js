'use strict';
var Greetings = require('./words/greetings');
var Antonyms = require('./words/antonyms');
var Banned = require('./words/banned');
var Auxiliary = require('./words/auxiliary');
var tokenize = require('./tokenize').tokenize;


// Get an array of interesting keywords
//
// @arg {Array.String} Capitalized array of words to pull keywords from
//
// @returns {Array.String}
function extract(norms) {
  if( typeof norms === 'undefined' || norms.length === 0){
    return Greetings;
  }
  return norms.reduce(function(acc, norm) {
    if( norm.match(/^[0-9]/ ) ){
      return acc;
    } else if( Banned[norm] ) {
      return acc;
    } else if( Antonyms[norm] ) {
      acc.push(Antonyms[norm]);
    } else {
      acc.push(norm);
    }
    return acc;
  }, []);
}

function interestingWords(input) {
  var inputTokens = tokenize(input);
  return extract(inputTokens.normalized).filter(function(keyword) {
    return !Auxiliary[keyword];
  });

}


module.exports = {
  extract: extract,
  interestingWords: interestingWords,
  Auxiliary: Auxiliary
};
