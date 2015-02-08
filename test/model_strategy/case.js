
/* global describe, it */
'use strict';
var expect = require('chai').expect;
var tokenize = require('../../src/tokenize').tokenize;
var caseStrategy = require('../../src/model_strategy/case');

describe('model_strategy/case', function() {
  it('encodes tokens into a casing model', function() {
    var observations = caseStrategy(tokenize('one Two tHree'));
    expect(observations).to.deep.equal(
      [
        {context: ['<fence>', 'ONE'], observed: 'one'},
        {context: ['one', 'TWO'], observed:  'Two'},
        {context: ['Two', 'THREE'], observed:  'tHree'},
      ]
    );
  });
});
