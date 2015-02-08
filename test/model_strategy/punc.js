
/* global describe, it */
'use strict';
var expect = require('chai').expect;
var tokenize = require('../../src/tokenize').tokenize;
var puncStrategy = require('../../src/model_strategy/punc');

describe('model_strategy/punc', function() {
  it('encodes tokens into a punc facing model', function() {
    var observations = puncStrategy(tokenize(' one,  two -- three!'));
    expect(observations).to.deep.equal(
      [
        {context: ['<fence>', 'one'], observed: ' '},
        {context: ['one', 'two'], observed: ',  '},
        {context: ['two', 'three'], observed: ' -- '},
        {context: ['three', '<fence>'], observed: '!'}
      ]
    );
  });
});
