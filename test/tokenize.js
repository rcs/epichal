/* global describe, it */
'use strict';
var expect = require('chai').expect;
var tokenize = require('../src/tokenize');

describe('tokenize', function() {
  it('joins words', function() {
    var compoundWords = tokenize.compoundWords;

    expect(
      compoundWords(['one', ' ', 'two', '- ', 'multi', '-', 'word', ''])
    ).to.deep.equal(
      ['one', ' ', 'two', '- ', 'multi-word', '']
    );
  });
  it('tokenizes input', function() {
    expect(
      tokenize.tokenize('a fancy thing. or two. with-joy')
    ).to.deep.equal({
      punctuation: ['', ' ', ' ', '. ', ' ', '. ',''],
      words: ['a', 'fancy', 'thing', 'or', 'two', 'with-joy'],
      normalized: ['A', 'FANCY', 'THING', 'OR', 'TWO', 'WITH-JOY']
    });
  });
  it('correctly deals with bounding on a non-word', function() {
    expect(
      tokenize.tokenize(' a fancy thing. or two. with-joy ')
    ).to.deep.equal({
      punctuation: [' ', ' ', ' ', '. ', ' ', '. ', ' '],
      words: ['a', 'fancy', 'thing', 'or', 'two', 'with-joy'],
      normalized: ['A', 'FANCY', 'THING', 'OR', 'TWO', 'WITH-JOY']
    });
  });

});
